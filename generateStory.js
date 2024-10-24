const axios = require('axios');
const qs = require('qs'); // Required to format the request body correctly

// Story Themes (as provided earlier)
const storyThemes = [
  {
    title: "The Power of Doing What's Right",
    theme:
      "True strength comes from making ethical choices, even when no one is watching. Integrity leads to respect and real success, while dishonesty results in negative consequences.",
  },
  {
    title: "The Hidden Treasure of Honesty",
    theme:
      "A hidden treasure can only be found by those who act with integrity. Dishonest characters are led astray, while the truthful hero discovers the treasure.",
  },
  {
    title: "The Kingdom of Truth",
    theme:
      "In a magical kingdom, honesty is valued above all. Those who are corrupt lose their fortunes, while the honest rise in status, showing how a just society thrives on integrity.",
  },
  {
    title: "The Ripple Effect of Good Deeds",
    theme:
      "One small act of honesty creates a chain reaction of positive outcomes for everyone involved. Conversely, acts of corruption lead to setbacks and chaos.",
  },
  {
    title: "The Honest Hero vs. The Trickster",
    theme:
      "An honest hero faces a trickster who uses lies to gain advantages. However, integrity and truth ultimately triumph over deceit.",
  },
  {
    title: "The Mirror of Truth",
    theme:
      "A magical mirror shows characters their true selves based on their actions. Honest characters see nobility, while liars see diminished reflections, highlighting the internal impact of dishonesty.",
  },
  {
    title: "The Honest Journey",
    theme:
      "A group of adventurers faces moral dilemmas on their journey. Those who choose honesty succeed, while those who give in to corruption face setbacks.",
  },
  {
    title: "The Tree of Truth",
    theme:
      "A magical tree only blooms for those who are truthful. It symbolizes how truth and fairness lead to growth, while dishonesty causes harm.",
  },
  {
    title: "The Honest Heart Amulet",
    theme:
      "A magical amulet rewards those with pure, honest hearts, while repelling those who lie and cheat, reinforcing that integrity is the real source of power.",
  },
  {
    title: "The Shadow of Corruption",
    theme:
      "A villain casts a shadow of corruption over the land. The shadow grows stronger with each dishonest act but weakens when characters act with honesty and integrity.",
  },
];

// Function to randomly select a story theme and generate a prompt
function storyTeller() {
  const randomIndex = Math.floor(Math.random() * storyThemes.length);
  const STORY_THEME = storyThemes[randomIndex];

  return `You are a storyteller for Nigerian children under 10 years old. Your task is to create a short, imaginative story that instills good character and develops awareness about honesty and integrity. The story should be engaging, easy to understand, and culturally relevant to Nigerian children.

You will be given a story theme to work with:
<story_theme>
${STORY_THEME.title}: ${STORY_THEME.theme}
</story_theme>

Follow these guidelines to create your story:

1. Structure your story with a clear beginning, middle, and end. Keep it concise, with no more than 15-20 short sentences total. Aim for 5-8 word sentences on average.

2. Use animal characters commonly found in Nigeria or African folklore as your main characters. Include at least one protagonist who demonstrates good character and one antagonist who represents dishonesty or greed.

3. Develop a simple plot that revolves around a moral dilemma or a situation where the protagonist must make a choice between right and wrong.

4. Integrate the theme of honesty and integrity naturally into the story. Show the positive outcomes of honest behavior and the negative consequences of dishonest actions.

5. Use simple language appropriate for children under 10 years old. Include some repetitive phrases or rhyming elements to make the story more memorable.

6. Set the story in recognizable Nigerian locations such as markets, villages, or near famous landmarks.

7. Include vivid sensory details to make the story more immersive for young listeners.

8. Add gentle humor to keep children engaged throughout the story.

9. Ensure that the story has a clear moral lesson that reinforces the importance of honesty and integrity.

After creating your story, format your output as a JSON object with the following structure:

{
  "image_prompt": string, // A brief description to be used as an AI image generation prompt for the story poster
  "title": string, // A catchy title for the story
  "story": string[], // An array of sentences from start to finish
  "lessons": string[], // An array of 2-3 moral lessons derived from the story
  "quiz": MCQ[] // An array of 5 MCQ objects
}

Where MCQ is structured as follows:
{
  question: string;
  options: { label: string; value: string }[];  // Allows any number of options
  correct: string;  // The correct answer should match one of the 'value' fields in options
}

For the image_prompt, create a vivid, child-friendly description of a key scene from your story. This should be a single sentence that captures the essence of the story and would make an engaging poster for children.

For the quiz:
- Create 5 multiple-choice questions (MCQs) that test comprehension of the story and its moral lessons
- Each MCQ should have 4 options (labeled a, b, c, d)
- Ensure the questions and answers are appropriate for children under 10 years old
- Make the questions engaging and fun, incorporating elements from the story
- The correct answer should match one of the 'value' fields in the options

Guidelines for creating effective MCQs for children:
1. Use clear and simple language
2. Keep questions short and focused on a single concept
3. Make sure all options are plausible but only one is correct
4. Avoid negative questions (e.g., "Which of these is NOT...")
5. Include questions that test both recall and understanding of the story's moral lessons

Remember to:
- Keep the story appropriate and engaging for children under 10 years old
- Focus on the themes of honesty and integrity while making the story entertaining
- Use animal characters and Nigerian settings to make the story relatable and imaginative
- Include sensory details and humor to keep children engaged
- Ensure all elements of the JSON object are properly formatted

Now, create your story based on the given theme and output it in the specified JSON format, including an engaging story, clear moral lessons, and age-appropriate quiz questions.`;
}

// Function to fetch the IAM token using the API key
async function getIamToken(apiKey) {
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
    const token = response.data.access_token;
    console.log('Bearer Token:', token);
    return token;
  } catch (error) {
    console.error('Error fetching IAM token:', error);
    throw error;
  }
}

// Function to generate a story using the IBM Text Generation API
async function generateStory(prompt) {
  try {
    const apiKey = 'jAVnlAciDqBL71GBCWscXsvj5Br7osn1lnoHOfP1ymJL'; // Replace with your actual API key
    const accessToken = await getIamToken(apiKey); // Fetch the IAM token

    const url = "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29";
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}` // Use the fetched token here
    };

    // Create the request body, where the 'input' is the story prompt provided by the user
    const body = {
      input: prompt,
      parameters: {
        decoding_method: "greedy",  // Greedy method for text generation
        max_new_tokens: 900,        // Maximum length of generated story
        min_new_tokens: 100,        // Minimum length of the generated story
        stop_sequences: [],         // Stop sequences can be used to control the generation end
        repetition_penalty: 1.0     // Penalty to avoid repetition
      },
      model_id: "mistralai/mistral-large",   // Model ID for the text generation task
      project_id: "7c2a4f4c-3b82-4dc9-ae69-18a451cca0f4" // Replace with your project ID
    };

    // Make the API request to generate text
    const response = await axios.post(url, body, { headers });

    if (response.status !== 200) {
      throw new Error("Non-200 response");
    }

    // Log the generated story to the console
    console.log("Generated Story:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error generating story:', error);
    throw error;
  }
}

// Main function to run the story generation
async function main() {
  const prompt = storyTeller(); // Get the prompt for story generation
  const story = await generateStory(prompt); // Generate the story based on the prompt
  console.log("Final Story:", JSON.stringify(story, null, 2)); // Log the final story as JSON
}

main(); // Call the main function to execute the process
