const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');
const qs = require('qs'); // Required to format the request body correctly

const app = express();
app.use(bodyParser.json());
app.use(cors());

let accessTokenCache = null;
let tokenExpiry = null;

// Function to randomly select a story theme and generate a prompt
function storyTeller() {
  return `
    Generate a short, imaginary story for children under 10 years old based on African folklore.
    Use animal characters commonly found in Nigeria or Africa as the main characters.
    The story should have a clear beginning, middle, and end, and revolve around a moral lesson about honesty and integrity.
    Set the story in a village or market, and make sure to keep it simple with 15-20 short sentences.
    Add gentle humor and vivid sensory details.

    Return the response in the following JSON format:
    {
      "image_prompt": "A brief description to be used as an AI image generation prompt for the story poster.",
      "title": "A catchy title for the story.",
      "story": ["Sentence 1", "Sentence 2", ..., "Sentence 20"],
      "lessons": ["Moral lesson 1", "Moral lesson 2", "Moral lesson 3"],
      "quiz": [
        {
          "question": "Quiz question 1?",
          "options": [
            { "label": "Option A", "value": "optionA" },
            { "label": "Option B", "value": "optionB" },
            { "label": "Option C", "value": "optionC" }
          ],
          "correct": "optionB"
        },
        {
          "question": "Quiz question 2?",
          "options": [
            { "label": "Option A", "value": "optionA" },
            { "label": "Option B", "value": "optionB" },
            { "label": "Option C", "value": "optionC" }
          ],
          "correct": "optionC"
        }
      ]
    }
  `;
}

// Function to fetch the IAM token using the API key
async function getIamToken(apiKey) {
  // Return cached token if still valid
  if (accessTokenCache && tokenExpiry > Date.now()) {
    return accessTokenCache;
  }

  try {
    const data = qs.stringify({
      'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
      'apikey': apiKey
    });

    const config = {
      method: 'post',
      url: 'https://iam.cloud.ibm.com/identity/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    const response = await axios(config);
    
    accessTokenCache = response.data.access_token; // Cache the token
    tokenExpiry = Date.now() + (response.data.expires_in * 1000); // Set token expiration time

    return accessTokenCache;
  } catch (error) {
    console.error('Error fetching IAM token:', error.response?.data || error.message);
    throw new Error('Failed to get IAM token');
  }
}

// Function to generate a story using the IBM Text Generation API
async function generateStory(prompt) {
  try {
    const apiKey = process.env.IBM_API_KEY;
    const accessToken = await getIamToken(apiKey); // Fetch or reuse IAM token

    const url = "https://eu-gb.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29";
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    };

    const body = {
      input: prompt,
      parameters: {
        decoding_method: "greedy",
        max_new_tokens: 900,
        min_new_tokens: 0,
        stop_sequences: [],
        repetition_penalty: 1
      },
      model_id: "mistralai/mistral-large",
      project_id: process.env.IBM_PROJECT_ID // Use your environment variable here
    };

    const response = await axios.post(url, body, { headers });

    // Check if the response is valid
    if (!response.data || response.status >= 300) {
      throw new Error("Invalid response from IBM Text Generation API");
    }

    return response.data;
  } catch (error) {
    console.error('Error generating story:', error.response?.data || error.message);
    throw new Error('Failed to generate story');
  }
}

// POST endpoint to handle story generation requests
// POST endpoint to handle story generation requests
app.post('/generate-story', async (req, res) => {
  try {
    const prompt = storyTeller(); // Generate prompt for story
    const storyResponse = await generateStory(prompt); // Call IBM API for story generation

    // Validate the response structure
    if (!storyResponse.results || !Array.isArray(storyResponse.results) || storyResponse.results.length === 0) {
      throw new Error('Invalid story structure');
    }

    // Assuming 'generated_text' is the field containing the story JSON, let's clean up the response
    const generatedText = storyResponse.results[0].generated_text;

    // Removing any surrounding backticks or code block markers if present
    const cleanedStory = generatedText.replace(/```json|```/g, '').trim();

    // Parse the cleaned text as JSON
    const storyData = JSON.parse(cleanedStory);

    // Send the parsed story data as the response
    res.json({storyData});

  } catch (error) {
    console.error('Error in /generate-story:', error.message);
    res.status(500).json({
      responseSuccessful: false,
      responseMessage: error.message || 'Internal Server Error',
      responseBody: ''
    });
  }
});


module.exports = app;
