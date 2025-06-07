'use client';

import { useState } from 'react';
import { summarizeTranscript } from '@/lib/gemini';
import { fetchTranscript } from '@/lib/transcript';

export default function Popup() {
  const [videoId, setVideoId] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    const transcript = await fetchTranscript(videoId);
    const summary = await summarizeTranscript(transcript);
    setSummary(summary);
    setLoading(false);
  };

  return (
    <div className="p-4 text-sm w-80">
      <input
        placeholder="Enter YouTube Video ID"
        className="w-full border p-2 rounded"
        value={videoId}
        onChange={(e) => setVideoId(e.target.value)}
      />
      <button
        onClick={handleSummarize}
        className="mt-2 w-full bg-blue-500 text-white p-2 rounded"
      >
        {loading ? "Summarizing..." : "Summarize"}
      </button>
      <div className="mt-4 whitespace-pre-wrap">{summary}</div>
    </div>
  );
}
