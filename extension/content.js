chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'getVideoId') {
      const url = new URL(window.location.href);
      sendResponse({ videoId: url.searchParams.get('v') });
    }
  });