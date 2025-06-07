'use client';

import { useState, useEffect } from 'react';
import { fetchTranscript } from '@/lib/transcript';
import { summarizeTranscript } from '@/lib/gemini';

export default function Popup() {
  const [videoId, setVideoId] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // On mount, request videoId from content script on YouTube tab
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getVideoId' }, (response: { videoId?: string }) => {
          if (chrome.runtime.lastError) {
            setError('Content script not found. Please refresh YouTube tab.');
            return;
          }
          if (response?.videoId) {
            setVideoId(response.videoId);
          } else {
            setError('No video ID found on this page');
          }
        });
      }
    });
  }, []);

  // Handle summarize button click
  const handleSummarize = async () => {
    if (!videoId) {
      setError('Please enter a valid YouTube Video ID');
      return;
    }
    setLoading(true);
    setError('');
    setSummary('');
    try {
      const transcript = await fetchTranscript(videoId);
      const summaryText = await summarizeTranscript(transcript);
      setSummary(summaryText);
    } catch (err) {
      setError('Failed to fetch or summarize transcript.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 text-sm w-80 font-sans">
      <input
        type="text"
        placeholder="YouTube Video ID"
        className="w-full border border-gray-300 p-2 rounded"
        value={videoId}
        onChange={(e) => setVideoId(e.target.value.trim())}
        autoFocus
      />
      <button
        onClick={handleSummarize}
        disabled={loading}
        className={`mt-3 w-full p-2 rounded text-white ${
          loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Summarizing...' : 'Summarize'}
      </button>

      {error && <p className="mt-3 text-red-600 text-xs">{error}</p>}

      <pre
        className="mt-4 whitespace-pre-wrap text-xs border border-gray-200 p-3 rounded max-h-72 overflow-y-auto bg-gray-50"
        aria-live="polite"
      >
        {summary || 'Summary will appear here'}
      </pre>
    </div>
  );
}
