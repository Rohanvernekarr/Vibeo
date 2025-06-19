// YouTube AI Summarizer - popup.js
const apiKeyInput = document.getElementById('popup-gemini-key');
const summaryStyleSelect = document.getElementById('popup-summary-style');
const saveBtn = document.getElementById('popup-save-settings');

chrome.storage.local.get(['geminiApiKey', 'summaryStyle'], (result) => {
  apiKeyInput.value = result.geminiApiKey || '';
  summaryStyleSelect.value = result.summaryStyle || 'brief';
});

saveBtn.onclick = () => {
  chrome.storage.local.set({
    geminiApiKey: apiKeyInput.value,
    summaryStyle: summaryStyleSelect.value
  }, () => {
    alert('Settings saved!');
  });
};

document.getElementById('open-settings').onclick = () => {
  window.open('sidebar.html', '_blank');
};
document.getElementById('open-bookmarks').onclick = () => {
  // For now, open sidebar (could be a bookmarks page)
  window.open('sidebar.html', '_blank');
}; 