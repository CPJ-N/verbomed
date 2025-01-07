import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface JournalEntryProps {
  journalId: string;
  onEntryCreated?: () => void;
}

export function JournalEntry({ journalId, onEntryCreated }: JournalEntryProps) {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // TODO: Implement OpenAI summarization
      const summary = 'AI-generated summary will go here';

      const { error } = await supabase
        .from('journal_entries')
        .insert({
          journal_id: journalId,
          content,
          summary,
        });

      if (error) throw error;

      setContent('');
      onEntryCreated?.();
    } catch (err) {
      console.error('Error creating journal entry:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    // TODO: Implement speech-to-text using Azure Cognitive Services
    setIsRecording(!isRecording);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-32 p-3 border rounded-md resize-none"
          placeholder="Write your journal entry..."
          required
        />
        <button
          type="button"
          onClick={toggleRecording}
          className={`absolute bottom-2 right-2 p-2 rounded-full ${
            isRecording ? 'bg-red-500' : 'bg-[#122f3b]'
          } text-white`}
        >
          🎤
        </button>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isProcessing}
          className="bg-[#e77155] text-white px-4 py-2 rounded-md hover:bg-[#a05b4c] transition-colors disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Save Entry'}
        </button>
      </div>
    </form>
  );
}
