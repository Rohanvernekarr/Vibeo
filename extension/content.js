// Listen for message from popup asking for video id
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getVideoId') {
    const url = new URL(window.location.href);
    const videoId = url.searchParams.get('v');
    sendResponse({ videoId });
  }
});
