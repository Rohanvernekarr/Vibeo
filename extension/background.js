// YouTube AI Summarizer - background.js
const GEMINI_RATE_LIMIT = 15; // requests per minute
const REQUEST_QUEUE = [];
let lastRequestTime = 0;
let requestsThisMinute = 0;
let queueTimer = null;

// Helper: Sleep
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Rate limiting and queueing
async function processQueue() {
  if (REQUEST_QUEUE.length === 0) return;
  const now = Date.now();
  if (requestsThisMinute >= GEMINI_RATE_LIMIT) {
    // Wait for next minute
    const wait = 60000 - (now - lastRequestTime);
    await sleep(Math.max(wait, 1000));
    requestsThisMinute = 0;
    lastRequestTime = Date.now();
  }
  const { request, sender, sendResponse } = REQUEST_QUEUE.shift();
  requestsThisMinute++;
  handleGeminiRequest(request, sender, sendResponse);
  if (REQUEST_QUEUE.length > 0) {
    queueTimer = setTimeout(processQueue, 1000);
  }
}

// Gemini API handler with exponential backoff
async function handleGeminiRequest(request, sender, sendResponse) {
  const { transcript, videoTitle, duration, options } = request;
  let apiKey = await getApiKey();
  let retries = 0;
  let backoff = 2000;
  while (retries < 5) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: options.prompt }] },],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
          }),
        }
      );
      const data = await response.json();
      if (data.error) {
        if (data.error.code === 429) throw new Error('Rate limit');
        if (data.error.code === 403) throw new Error('Invalid API key');
        throw new Error(data.error.message);
      }
      sendResponse({ success: true, data });
      return;
    } catch (err) {
      if (retries < 4) {
        await sleep(backoff);
        backoff *= 2;
        retries++;
      } else {
        sendResponse({ success: false, error: err.message });
        return;
      }
    }
  }
}

// API key management
function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['geminiApiKey'], (result) => {
      resolve(result.geminiApiKey || '');
    });
  });
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GEMINI_SUMMARIZE') {
    REQUEST_QUEUE.push({ request, sender, sendResponse });
    if (!queueTimer) processQueue();
    return true; // async
  }
  if (request.type === 'SET_GEMINI_API_KEY') {
    chrome.storage.local.set({ geminiApiKey: request.apiKey }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  if (request.type === 'GET_GEMINI_API_KEY') {
    getApiKey().then(apiKey => sendResponse({ apiKey }));
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('Vibeo extension installed');
  });
  