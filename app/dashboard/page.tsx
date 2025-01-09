'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mic, Volume2, Globe, FileText } from 'lucide-react';
import { textToSpeech } from '@/lib/speech';
import { summarizeText, translateMedicalTerms } from '@/lib/ai';
import { useAuth } from '@/lib/auth';

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  summary?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [partialSpeech, setPartialSpeech] = useState('');
  const [fullSpeech, setFullSpeech] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = new (window as any).webkitSpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            setFullSpeech((prev) => prev + event.results[i][0].transcript);
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setPartialSpeech(interim);
      };
      rec.onend = () => {
        setIsRecording(false);
        if (isRecording) {
          rec.start(); // Restart if user hasn't turned mic off
          setIsRecording(true);
        }
      };
      setRecognition(rec);
    } else {
      setError('Speech recognition not supported');
    }
  }, [isRecording]);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
    setLoading(false);
  }, [user, router, loading]);

  const toggleMic = () => {
    if (!recognition) return;
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const saveNote = async () => {
    if (fullSpeech.trim()) {
      try {
        const summary = await summarizeText(fullSpeech);
        const { data, error } = await supabase
          .from('journal_entries')
          .insert({
            content: fullSpeech,
            summary,
            created_by: user?.id,  // Changed from user_id to created_by
            created_at: new Date().toISOString()
          })
          .select();

        if (error) throw error;

        const newEntry: JournalEntry = {
          id: data[0].id,
          content: fullSpeech,
          summary,
          created_at: new Date().toISOString()
        };
        setJournalEntries([newEntry, ...journalEntries]);
        setFullSpeech(''); // Clear the speech content after saving
        setPartialSpeech('');
      } catch {
        setError('Failed to save note');
      }
    }
  };

  const fetchSavedNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('created_by', user?.id)  // Changed from user_id to created_by
        .order('created_at', { ascending: false });

      if (error) throw error;

      setJournalEntries(data);
    } catch {
      setError('Failed to fetch saved notes');
    }
  }, [user, supabase, setError, setJournalEntries]);

  useEffect(() => {
    if (user) {
      fetchSavedNotes();
    }
  }, [user, fetchSavedNotes]);

  const translateToPlainLanguage = async () => {
    try {
      const translated = await translateMedicalTerms(fullSpeech);
      setFullSpeech(translated);
    } catch {
      setError('Translation failed');
    }
  };

  const playTextToSpeech = async () => {
    try {
      await textToSpeech(fullSpeech);
    } catch {
      setError('Text-to-speech failed');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8faef] flex flex-col">
      <header className="w-full bg-[#122f3b] text-white py-6 fixed top-0 z-50">
        <div className="container mx-auto px-4">
          <nav className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Verbomed</h1>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-[#a05b4c] text-[#a05b4c] hover:bg-[#e77155] hover:text-[#f8faef]"
            >
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      <div className="w-full flex justify-center mt-32 mb-4">
        <div
          className={`rounded-full border-4 border-[#122f3b] p-8 cursor-pointer ${
        isRecording ? 'animate-pulse' : ''
          }`}
          onClick={toggleMic}
        >
          <Mic className="w-10 h-10 text-[#122f3b]" />
        </div>
      </div>

      <main className="container mx-auto px-4 pb-12">
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-wrap gap-4 mb-4">
                <Button
                  onClick={playTextToSpeech}
                  className="flex items-center gap-2"
                  variant="secondary"
                >
                  <Volume2 className="w-5 h-5" />
                  Text to Speech
                </Button>

                <Button
                  onClick={translateToPlainLanguage}
                  className="flex items-center gap-2"
                  variant="secondary"
                >
                  <Globe className="w-5 h-5" />
                  Translate Terms
                </Button>
              </div>

              <textarea
                className="w-full p-4 border rounded-lg mb-4 min-h-32 focus:ring-2 focus:ring-[#122f3b] focus:border-transparent"
                value={fullSpeech + partialSpeech}
                onChange={(e) => {
                  setFullSpeech(e.target.value);
                  setPartialSpeech('');
                }}
                placeholder="Enter your notes here..."
              />

              <div className="flex justify-end">
                <Button
                  onClick={saveNote}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Save Note
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {journalEntries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#594543]">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[#122f3b]">{entry.content}</p>
                  {entry.summary && (
                    <div className="mt-4 p-4 bg-[#f8faef] rounded-lg">
                      <p className="text-sm text-[#594543]">{entry.summary}</p>
                    </div>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
