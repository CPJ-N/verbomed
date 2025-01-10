export async function summarizeText(text: string): Promise<string> {
  try {
    const response = await fetch('/api/ai/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.summary;
  } catch (error) {
    console.error('Error in summarizeText:', error);
    throw new Error('Failed to generate summary');
  }
}