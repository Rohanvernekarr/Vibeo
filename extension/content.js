// YouTube AI Summarizer - content.js
import { getTranscript, getVideoTitle, getVideoDuration } from './api/youtube.js';

function getVideoId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('v');
}

function injectSidebar() {
  if (document.getElementById('yt-ai-sidebar')) return;
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.id = 'yt-ai-sidebar';
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.right = '0';
  iframe.style.width = '400px';
  iframe.style.height = '100vh';
  iframe.style.zIndex = '999999';
  iframe.style.border = 'none';
  iframe.style.boxShadow = '0 0 16px rgba(26,115,232,0.2)';
  document.body.appendChild(iframe);
}

// Listen for YouTube video page
function onYouTubeWatchPage() {
  injectSidebar();
}

// Listen for messages from sidebar
window.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'YT_AI_REQUEST') {
    const videoId = getVideoId();
    const title = getVideoTitle();
    const duration = getVideoDuration();
    const transcript = await getTranscript(videoId);
    window.postMessage({
      type: 'YT_AI_RESPONSE',
      transcript,
      videoId,
      title,
      duration
    }, '*');
  }
});

// Detect page changes (YouTube SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (location.href.includes('youtube.com/watch')) {
      setTimeout(onYouTubeWatchPage, 1000);
    }
  }
}).observe(document, { subtree: true, childList: true });

// Initial load
if (location.href.includes('youtube.com/watch')) {
  setTimeout(onYouTubeWatchPage, 1000);
}
