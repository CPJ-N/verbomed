'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mic, Volume2, Globe, FileText } from 'lucide-react';
import { textToSpeech, speechToText } from '@/lib/speech';
import { summarizeText, translateMedicalTerms } from '@/lib/ai';
import { useAuth } from '@/lib/auth';

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  summary?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentNote, setCurrentNote] = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const startVoiceRecording = async () => {
    try {
      if (isRecording) {
        setIsRecording(false);
        const text = await speechToText();
        setCurrentNote(prev => prev + ' ' + text);
      } else {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
      }
    } catch {
      setError('Unable to access microphone');
      setIsRecording(false);
    }
  };

  const saveNote = async () => {
    if (currentNote.trim()) {
      try {
        const summary = await summarizeText(currentNote);
        const newEntry: JournalEntry = {
          id: String(Date.now()),
          content: currentNote,
          summary,
          created_at: new Date().toISOString()
        };
        setJournalEntries([newEntry, ...journalEntries]);
        setCurrentNote('');
      } catch {
        setError('Failed to save note');
      }
    }
  };

  const translateToPlainLanguage = async () => {
    try {
      const translated = await translateMedicalTerms(currentNote);
      setCurrentNote(translated);
    } catch {
      setError('Translation failed');
    }
  };

  const playTextToSpeech = async () => {
    try {
      await textToSpeech(currentNote);
    } catch {
      setError('Text-to-speech failed');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8faef]">
      <header className="bg-[#122f3b] text-white py-6">
        <div className="container mx-auto px-4">
          <nav className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Verbomed</h1>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
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
                  onClick={startVoiceRecording}
                  className="flex items-center gap-2"
                  variant={isRecording ? "destructive" : "default"}
                >
                  <Mic className="w-5 h-5" />
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                
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
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
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