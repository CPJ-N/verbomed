import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development, remove in production
});

export async function summarizeText(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical assistant that creates concise summaries of medical notes. Keep summaries brief and focused on key points."
        },
        {
          role: "user",
          content: `Please summarize this medical note: ${text}`
        }
      ],
      max_tokens: 100
    });

    return response.choices[0]?.message?.content || 'Unable to generate summary';
  } catch (error) {
    console.error('Error in summarizeText:', error);
    throw new Error('Failed to generate summary');
  }
}

export async function translateMedicalTerms(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical translator that converts medical terminology into plain, easy-to-understand language. Maintain accuracy while making the text accessible to non-medical professionals."
        },
        {
          role: "user",
          content: `Please translate this medical text into plain language: ${text}`
        }
      ],
      max_tokens: 200
    });

    return response.choices[0]?.message?.content || 'Unable to translate text';
  } catch (error) {
    console.error('Error in translateMedicalTerms:', error);
    throw new Error('Failed to translate text');
  }
}
