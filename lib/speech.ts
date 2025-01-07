'use client';

import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

// Create speech config on client side only
const createSpeechConfig = () => {
  return sdk.SpeechConfig.fromSubscription(
    process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
    process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
  );
};

export async function speechToText(): Promise<string> {
  const speechConfig = createSpeechConfig();
  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          resolve(result.text);
        } else {
          reject(new Error('Speech recognition failed'));
        }
        recognizer.close();
      },
      (error) => {
        reject(error);
        recognizer.close();
      }
    );
  });
}

export async function textToSpeech(text: string): Promise<void> {
  const speechConfig = createSpeechConfig();
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve();
        } else {
          reject(new Error('Speech synthesis failed'));
        }
        synthesizer.close();
      },
      (error) => {
        reject(error);
        synthesizer.close();
      }
    );
  });
}
