import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { together } from '@/lib/together';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

function cleanMarkdownSyntax(text: string): string {
  return text
    .replace(/\*\*/g, '') // Remove bold syntax
    .replace(/\*/g, '')   // Remove any remaining asterisks
    .replace(/- /g, '')   // Remove list markers
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim();
}

export async function POST(request: Request) {
  try {
    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabaseAuth.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const filePath = `${userId}/${file.name}`;
    let fileUrl = '';

    // Check if file already exists
    const { data: existingFile } = await supabase.storage
      .from('med-docs')
      .list(userId, {
        search: file.name
      });

    if (existingFile && existingFile.length > 0) {
      // File exists, just get the signed URL
      const { data: signedUrlData, error: urlError } = await supabase
        .storage
        .from('med-docs')
        .createSignedUrl(filePath, 3600);

      if (urlError) {
        console.error('Error generating signed URL for existing file:', urlError);
      } else {
        fileUrl = signedUrlData.signedUrl;
      }
    } else {
      // File doesn't exist, upload it
      const { data, error } = await supabase.storage
        .from('med-docs')
        .upload(filePath, file);

      if (error || !data) {
        throw new Error('Upload failed: ' + error?.message || 'No data returned');
      }

      // Get signed URL for new upload
      const { data: signedUrlData, error: urlError } = await supabase
        .storage
        .from('med-docs')
        .createSignedUrl(filePath, 3600);

      if (urlError) {
        console.error('Error generating signed URL for new file:', urlError);
      } else {
        fileUrl = signedUrlData.signedUrl;
      }
    }

    if (!fileUrl) {
      throw new Error('Failed to generate signed URL');
    }

    const getDescriptionPrompt = `Analyze this medical document/image in detail. Please follow these guidelines:
    - Identify and describe any medical terminology, diagnoses, or findings present
    - Note any measurements, test results, or numerical values
    - Describe any visible symptoms, conditions, or anatomical features
    - Point out any dates, patient information (if visible), or medical provider details
    - Highlight any recommendations, treatments, or follow-up instructions
    - If it's an image (like an X-ray, MRI, etc.), describe the anatomical structures and any abnormalities
    Please provide this information in clear, detailed medical terms.`;

    const completion = await together.chat.completions.create({
      model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
      temperature: 0.2,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: getDescriptionPrompt },
            {
              type: "image_url",
              image_url: {
                url: fileUrl,
              },
            }
          ],
        }
      ],
    });

    const explanation = completion.choices[0]?.message?.content?.trim() || 'Unable to analyze image';
    const cleanedExplanation = cleanMarkdownSyntax(explanation);

    return NextResponse.json({ explanation: cleanedExplanation });
  } catch (error) {
    console.error('Error in analyze route:', error);
    return NextResponse.json({ error: 'Failed to analyze file' }, { status: 500 });
  }
}
