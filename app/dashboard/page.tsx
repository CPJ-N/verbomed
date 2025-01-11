'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mic, Volume2, FileText, Trash2 } from 'lucide-react';
import { textToSpeech } from '@/lib/speech';
import { summarizeText } from '@/lib/ai';
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
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'journal' | 'analysis'>('journal');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        console.log('Summary:', summary);
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

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJournalEntries(journalEntries.filter(entry => entry.id !== id));
    } catch {
      setError('Failed to delete note');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async () => {
    setError('');
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisResult(null); // Clear previous results
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setAnalysisResult(data.explanation);
    } catch {
      setError('Failed to analyze file');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8faef]">
      <header className="w-full bg-[#122f3b] text-white py-2 fixed top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold tracking-wider">Verbomed</h1>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => setActiveTab('journal')}
                  variant={activeTab === 'journal' ? 'default' : 'outline'}
                  className={`${
                    activeTab === 'journal'
                      ? 'bg-[#e77155] text-white border-[#e77155] hover:bg-[#e77155]/90 hover:text-white'
                      : 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#122f3b]'
                  } transition-all px-4 min-w-[120px]`}
                >
                  Journal Add Note
                </Button>
                <Button
                  onClick={() => setActiveTab('analysis')}
                  variant={activeTab === 'analysis' ? 'default' : 'outline'}
                  className={`${
                    activeTab === 'analysis'
                      ? 'bg-[#e77155] text-white border-[#e77155] hover:bg-[#e77155]/90 hover:text-white'
                      : 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#122f3b]'
                  } transition-all px-4 min-w-[120px]`}
                >
                  Image Analysis
                </Button>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="bg-transparent border-1 border-white text-white hover:bg-white hover:text-[#122f3b] transition-all px-4"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 mt-[80px] pb-12">
        {error && (
          <Alert className="mb-4 max-w-4xl mx-auto" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="max-w-4xl mx-auto mt-4">
          {activeTab === 'journal' && (
            <>
              <div className="w-full flex justify-center mb-8">
                <div
                  className={`rounded-full border-4 border-[#122f3b] p-8 cursor-pointer transition-transform hover:scale-105 ${
                    isRecording ? 'animate-pulse bg-[#122f3b]/10' : ''
                  }`}
                  onClick={toggleMic}
                >
                  <Mic className="w-10 h-10 text-[#122f3b]" />
                </div>
              </div>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(entry.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
            </>
          )}

          {activeTab === 'analysis' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center">
              <div className="mb-8 space-y-2">
                <h2 className="text-2xl font-semibold text-[#122f3b]">Image Analysis</h2>
                <p className="text-[#594543]">
                  Upload an image to receive an AI-powered analysis. 
                  Supported formats: JPG, PNG, GIF (max 5MB)
                </p>
              </div>
              
              <div className="w-full space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <Label 
                    htmlFor="file-upload" 
                    className="cursor-pointer bg-white px-6 py-3 rounded-md border-2 border-[#122f3b] hover:bg-[#122f3b] hover:text-white transition-colors font-medium"
                  >
                    Choose File to Analyze
                  </Label>
                  <input 
                    id="file-upload"
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  {file && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#122f3b]/20 w-full max-w-[300px]">
                      <div className="flex-shrink-0 p-2 bg-[#122f3b]/5 rounded-md">
                        <FileText className="w-5 h-5 text-[#122f3b]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#122f3b] truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-[#594543]">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFile}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  )}
                  <Button 
                    onClick={uploadFile} 
                    className="bg-[#e77155] hover:bg-[#e77155]/90 w-full max-w-[200px] relative"
                    disabled={!file || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                        <span className="opacity-0">Analyze Image</span>
                      </>
                    ) : (
                      "Analyze Image"
                    )}
                  </Button>
                </div>
              </div>
              
              {isAnalyzing && (
                <div className="mt-8 p-6 bg-white rounded-lg border border-[#122f3b]/20 w-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-3 border-[#122f3b] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#594543] animate-pulse">Analyzing your image...</p>
                  </div>
                </div>
              )}
              
              {analysisResult && !isAnalyzing && (
                <div className="mt-8 p-6 bg-white rounded-lg border border-[#122f3b]/20 w-full">
                  <h3 className="font-semibold mb-2 text-[#122f3b]">Analysis Result</h3>
                  <p className="text-[#594543]">{analysisResult}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
