# Verbomed - Healthcare Communication Platform

![Verbomed Screenshot](/public/Screenshot%202025-01-06%20at%2011.16.56%20PM.png)

## Overview

Verbomed is a modern healthcare communication platform designed to bridge the gap between healthcare providers and patients. Built with Next.js and powered by AI, it offers seamless communication tools with features like voice interaction, medical term translation, and intelligent note summarization.

## Features

### 🎤 Voice Interaction
- Speech-to-text for easy note taking
- Text-to-speech for accessibility
- Powered by Azure Speech Services

### 🤖 AI-Powered Features
- Automatic summarization of medical notes using GPT-4
- Medical terminology translation to plain language
- Intelligent context preservation

### 🔒 Security & Authentication
- Secure authentication with Supabase
- HIPAA-compliant data handling
- End-to-end encryption

### 💅 Modern UI/UX
- Clean, professional interface with shadcn UI
- Responsive design for all devices
- Intuitive navigation

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Components**: shadcn UI, Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **AI Services**: 
  - OpenAI GPT-4 for summarization and translation
  - Azure Speech Services for voice features
- **Styling**: Tailwind CSS with custom color scheme

## Color Scheme

```css
- Background: #f8faef
- Primary: #122f3b
- Secondary: #594543
- Accent: #a05b4c
- Highlight: #e77155
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # OpenAI Configuration
   NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key

   # Azure Speech Services
   NEXT_PUBLIC_AZURE_SPEECH_KEY=your-azure-speech-key
   NEXT_PUBLIC_AZURE_SPEECH_REGION=your-azure-region
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Authentication by [Supabase](https://supabase.com/)
- AI features powered by [OpenAI](https://openai.com/) and [Azure](https://azure.microsoft.com/)
