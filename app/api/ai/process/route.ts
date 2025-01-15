import { NextResponse } from 'next/server';
import { together } from '@/lib/together';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const completion = await together.chat.completions.create({
      model: 'meta-llama/Llama-Vision-Free',
      messages: [
        {
          role: 'system',
          content: `You are a medical assistant that creates clear summaries of medical notes. 
          Provide a simple explanation of the summary in everyday language.
          Format the response in clear paragraphs without bullet points or markdown.
          Do not include phrases like "Here's a simple explanation of the patient's situation:".`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 100,
      temperature: 0.4,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || '';
    
    // Clean up markdown and format into paragraphs
    const cleanedSummary = summary
      .replace(/\*\*/g, '')
      .replace(/^\s*[\*\-]\s*/gm, '')
      .replace(/([^.!?])\n/g, '$1 ')
      .replace(/\n\n+/g, '\n\n')
      .trim();
    
    return NextResponse.json({ summary: cleanedSummary });
  } catch (error) {
    console.error('Error in process route:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
