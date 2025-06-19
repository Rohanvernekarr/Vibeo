// extension/api/youtube.js

async function getTranscript(videoId) {
  // TODO: Implement transcript extraction (YouTube API or DOM)
  return null;
}

function getVideoTitle() {
  return document.title.replace(' - YouTube', '');
}

function getVideoDuration() {
  // TODO: Extract duration from DOM or YouTube API
  return null;
}

if (typeof module !== 'undefined') module.exports = { getTranscript, getVideoTitle, getVideoDuration }; 