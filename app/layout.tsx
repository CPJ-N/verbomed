import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import Head from "next/head";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Verbomed - Healthcare Communication Platform",
  description: "A secure AI-powered platform for better healthcare communication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <meta property="og:title" content="Verbomed - Healthcare Communication Platform" />
        <meta property="og:description" content="A secure AI-powered platform for better healthcare communication." />
        <meta property="og:image" content="/logo-preview.png" />
        <meta property="og:url" content="https://your-deployed-app-url.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Verbomed - Healthcare Communication Platform" />
        <meta name="twitter:description" content="A secure AI-powered platform for better healthcare communication." />
        <meta name="twitter:image" content="/logo-preview.png" />
      </Head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f8faef]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}