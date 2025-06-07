'use client';
import { useState, useEffect } from 'react';
import { fetchTranscript } from '@/lib/transcript';
import { summarizeTranscript } from '@/lib/gemini';

export default function Popup() {
  const [videoId, setVideoId] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ask content script for video ID on mount
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getVideoId' }, (response) => {
          if (response?.videoId) {
            setVideoId(response.videoId);
          } else {
            setError('No video ID found on this page');
          }
        });
      }
    });
  }, []);

  const handleSummarize = async () => {
    if (!videoId) {
      setError('Enter a valid video ID');
      return;
    }
    setLoading(true);
    setError('');
    setSummary('');
    try {
      const transcript = await fetchTranscript(videoId);
      const summaryText = await summarizeTranscript(transcript);
      setSummary(summaryText);
    } catch (e) {
      setError('Failed to summarize video.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 text-sm w-80">
      <input
        placeholder="YouTube Video ID"
        className="w-full border p-2 rounded"
        value={videoId}
        onChange={(e) => setVideoId(e.target.value)}
      />
      <button
        onClick={handleSummarize}
        className="mt-2 w-full bg-blue-500 text-white p-2 rounded"
        disabled={loading}
      >
        {loading ? 'Summarizing...' : 'Summarize'}
      </button>
      {error && <div className="mt-2 text-red-600">{error}</div>}
      <pre className="mt-4 whitespace-pre-wrap text-xs">{summary || 'Summary will appear here'}</pre>
    </div>
  );
}
