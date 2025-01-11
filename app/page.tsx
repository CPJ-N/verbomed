'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic, Volume2, Globe, FileText, Lock, User, ArrowRight } from 'lucide-react';
import Image from 'next/image';

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="text-[#122f3b]">{icon}</div>
          <div className="space-y-1">
            <CardTitle className="text-lg text-[#122f3b]">{title}</CardTitle>
            <CardDescription className="text-[#594543]">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const handleGetStarted = () => {
    router.push(user ? '/dashboard' : '/login');
  };

  return (
    <div className="min-h-screen bg-[#f8faef]">
      <header className="bg-[#122f3b] text-white py-6">
        <div className="container mx-auto px-4">
          <nav className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Verbomed</h1>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="border-[#a05b4c] text-[#a05b4c] hover:bg-[#e77155] hover:text-[#f8faef]"
            >
              Get Started <ArrowRight className="ml-2" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <section className="text-center mb-16">
            <h2 className="text-5xl font-bold text-[#122f3b] mb-6">
              Bridging Healthcare Communication Gaps
            </h2>
            <p className="text-xl text-[#594543] mb-8">
              A secure AI-powered platform for seamless communication between healthcare providers and patients.
            </p>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-[#122f3b] hover:bg-[#0a1c24] text-white"
            >
              Get Started <ArrowRight className="ml-2" />
            </Button>
          </section>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Voice Interaction"
              description="Convert speech to text and text to speech for easier communication"
              icon={<Mic className="h-6 w-6" />}
            />
            <FeatureCard
              title="AI Summarization"
              description="Get concise summaries of patient notes and medical records"
              icon={<FileText className="h-6 w-6" />}
            />
            <FeatureCard
              title="Medical Translation"
              description="Understand medical terms in plain language"
              icon={<Globe className="h-6 w-6" />}
            />
            <FeatureCard
              title="Text to Speech"
              description="Convert written notes to clear, natural speech"
              icon={<Volume2 className="h-6 w-6" />}
            />
            <FeatureCard
              title="Secure Access"
              description="HIPAA-compliant security for your medical data"
              icon={<Lock className="h-6 w-6" />}
            />
            <FeatureCard
              title="User-Friendly"
              description="Intuitive interface designed for healthcare professionals"
              icon={<User className="h-6 w-6" />}
            />
          </div>
          {/* Add the image here */}
            <div className="mt-16">
            <Image
              src="/verbomed-visual.png"
              alt="Verbomed Concept Flow Chart"
              width={800}
              height={400}
              className="mx-auto rounded-lg shadow-2xl"
              priority
            />
            </div>
        </div>
      </main>
    </div>
  );
}