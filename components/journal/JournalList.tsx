import { useEffect, useCallback, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface JournalEntry {
  id: string;
  created_at: string;
  content: string;
  summary?: string;
  audio_url?: string;
}

interface JournalListProps {
  journalId: string;
}

export function JournalList({ journalId }: JournalListProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('journal_id', journalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching journal entries:', err);
    } finally {
      setLoading(false);
    }
  }, [journalId, supabase]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const playAudio = async (audioUrl: string) => {
    // TODO: Implement text-to-speech using Azure Cognitive Services
    console.log('Playing audio:', audioUrl);
  };

  if (loading) {
    return <div className="text-center py-4">Loading entries...</div>;
  }

  return (
    <div className="space-y-6">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="bg-white p-6 rounded-lg shadow-md space-y-4"
        >
          <div className="flex justify-between items-start">
            <p className="text-sm text-gray-500">
              {new Date(entry.created_at).toLocaleString()}
            </p>
            {entry.audio_url && (
              <button
                onClick={() => playAudio(entry.audio_url!)}
                className="text-[#122f3b] hover:text-[#594543]"
              >
                🔊 Play
              </button>
            )}
          </div>
          <p className="text-[#122f3b]">{entry.content}</p>
          {entry.summary && (
            <div className="mt-4 p-4 bg-[#f8faef] rounded-md">
              <h4 className="text-sm font-semibold text-[#594543] mb-2">
                AI Summary
              </h4>
              <p className="text-sm text-[#594543]">{entry.summary}</p>
            </div>
          )}
        </div>
      ))}
      {entries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No entries yet. Start writing your first entry!
        </div>
      )}
    </div>
  );
}
