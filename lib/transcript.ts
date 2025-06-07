import { YoutubeTranscript } from 'youtube-transcript';

export async function fetchTranscript(videoId: string) {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  return transcript.map(t => `[${t.offset}] ${t.text}`).join("\n");
}
