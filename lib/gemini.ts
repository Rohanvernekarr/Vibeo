import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function summarizeTranscript(transcript: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Summarize this YouTube transcript into key points with timestamps:\n\n${transcript}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
