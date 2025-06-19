// YouTube AI Summarizer - sidebar.js
const loadingEl = document.getElementById('yt-ai-loading');
const summaryEl = document.getElementById('yt-ai-summary');
const errorEl = document.getElementById('yt-ai-error');
const settingsPanel = document.getElementById('yt-ai-settings-panel');
const exportBtn = document.getElementById('yt-ai-export-pdf');
const bookmarkBtn = document.getElementById('yt-ai-bookmark');
const saveSettingsBtn = document.getElementById('save-settings');
const apiKeyInput = document.getElementById('gemini-key');
const summaryStyleSelect = document.getElementById('summary-style');
const includeQuotesCheckbox = document.getElementById('include-quotes');
const chapterBreakdownCheckbox = document.getElementById('chapter-breakdown');

// Load settings
chrome.storage.local.get(['geminiApiKey', 'summaryStyle', 'includeQuotes', 'chapterBreakdown'], (result) => {
  apiKeyInput.value = result.geminiApiKey || '';
  summaryStyleSelect.value = result.summaryStyle || 'brief';
  includeQuotesCheckbox.checked = !!result.includeQuotes;
  chapterBreakdownCheckbox.checked = !!result.chapterBreakdown;
});

saveSettingsBtn.onclick = () => {
  chrome.storage.local.set({
    geminiApiKey: apiKeyInput.value,
    summaryStyle: summaryStyleSelect.value,
    includeQuotes: includeQuotesCheckbox.checked,
    chapterBreakdown: chapterBreakdownCheckbox.checked
  }, () => {
    alert('Settings saved!');
  });
};

function showLoading() {
  loadingEl.style.display = '';
  summaryEl.style.display = 'none';
  errorEl.style.display = 'none';
}
function showSummary() {
  loadingEl.style.display = 'none';
  summaryEl.style.display = '';
  errorEl.style.display = 'none';
}
function showError(msg) {
  loadingEl.style.display = 'none';
  summaryEl.style.display = 'none';
  errorEl.style.display = '';
  errorEl.textContent = msg;
}

// Request transcript from content script
function requestTranscript() {
  window.parent.postMessage({ type: 'YT_AI_REQUEST' }, '*');
}

// Listen for transcript response
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'YT_AI_RESPONSE') {
    const { transcript, title, duration } = event.data;
    if (!transcript) {
      showError('Transcript not available for this video.');
      return;
    }
    summarize(transcript, title, duration);
  }
});

// Build Gemini prompt
function buildPrompt(transcript, title, duration) {
  let prompt = `Analyze this YouTube video transcript and provide:\n\n1. MAIN SUMMARY (3-5 sentences)\n2. KEY POINTS with timestamps:\n   - [MM:SS] Point description\n3. IMPORTANT QUOTES with exact timing\n4. CHAPTER BREAKDOWN\n5. ACTION ITEMS (if any)\n6. TAGS/CATEGORIES\n\nVideo Title: ${title}\nDuration: ${duration || 'unknown'}\nTranscript: ${transcript}\n\nFormat response as JSON with this structure:\n{\n  "summary": "...",\n  "keyPoints": [{"timestamp": "MM:SS", "point": "..."}],\n  "quotes": [{"timestamp": "MM:SS", "quote": "..."}],\n  "chapters": [{"start": "MM:SS", "title": "..."}],\n  "tags": ["tag1", "tag2"]\n}`;
  // Add style options
  if (summaryStyleSelect.value === 'detailed') prompt = '[DETAILED]\n' + prompt;
  if (summaryStyleSelect.value === 'academic') prompt = '[ACADEMIC]\n' + prompt;
  if (summaryStyleSelect.value === 'casual') prompt = '[CASUAL]\n' + prompt;
  if (!includeQuotesCheckbox.checked) prompt += '\nOmit quotes.';
  if (!chapterBreakdownCheckbox.checked) prompt += '\nOmit chapter breakdown.';
  return prompt;
}

// Summarize with Gemini
function summarize(transcript, title, duration) {
  showLoading();
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    const apiKey = result.geminiApiKey;
    if (!apiKey) {
      showError('Please enter your Gemini API key in settings.');
      return;
    }
    const prompt = buildPrompt(transcript, title, duration);
    chrome.runtime.sendMessage({
      type: 'GEMINI_SUMMARIZE',
      transcript,
      videoTitle: title,
      duration,
      options: { prompt }
    }, (response) => {
      if (!response || !response.success) {
        showError(response && response.error ? response.error : 'Gemini API error.');
        return;
      }
      try {
        const json = JSON.parse(response.data.candidates[0].content.parts[0].text);
        renderSummary(json);
      } catch (e) {
        showError('Failed to parse Gemini response.');
      }
    });
  });
}

// Render summary
function renderSummary(json) {
  showSummary();
  let html = '';
  html += `<h4>Summary</h4><p>${json.summary}</p>`;
  if (json.keyPoints && json.keyPoints.length) {
    html += '<h4>Key Points</h4><ul>';
    for (const kp of json.keyPoints) {
      html += `<li><span class="yt-ai-timestamp" data-ts="${kp.timestamp}">${kp.timestamp}</span> ${kp.point}</li>`;
    }
    html += '</ul>';
  }
  if (json.quotes && json.quotes.length) {
    html += '<h4>Important Quotes</h4><ul>';
    for (const q of json.quotes) {
      html += `<li><span class="yt-ai-timestamp" data-ts="${q.timestamp}">${q.timestamp}</span> "${q.quote}"</li>`;
    }
    html += '</ul>';
  }
  if (json.chapters && json.chapters.length) {
    html += '<h4>Chapters</h4><ul>';
    for (const ch of json.chapters) {
      html += `<li><span class="yt-ai-timestamp" data-ts="${ch.start}">${ch.start}</span> ${ch.title}</li>`;
    }
    html += '</ul>';
  }
  if (json.tags && json.tags.length) {
    html += '<h4>Tags</h4><p>' + json.tags.map(t => `<span class="yt-ai-tag">${t}</span>`).join(' ') + '</p>';
  }
  summaryEl.innerHTML = html;
  // Timestamp chips
  summaryEl.querySelectorAll('.yt-ai-timestamp').forEach(el => {
    el.onclick = () => {
      const ts = el.getAttribute('data-ts');
      jumpToTimestamp(ts);
    };
  });
}

// Jump to video moment
function jumpToTimestamp(ts) {
  // Convert MM:SS to seconds
  const [m, s] = ts.split(':').map(Number);
  const seconds = m * 60 + s;
  // Post message to content script to seek
  window.parent.postMessage({ type: 'YT_AI_SEEK', seconds }, '*');
}

// Export PDF
exportBtn.onclick = () => {
  chrome.runtime.getURL('libs/jspdf.min.js');
  const doc = new window.jspdf.jsPDF();
  doc.text(summaryEl.innerText, 10, 10);
  doc.save('youtube-summary.pdf');
};

// Bookmark (save summary locally)
bookmarkBtn.onclick = () => {
  chrome.storage.local.get(['bookmarks'], (result) => {
    const bookmarks = result.bookmarks || [];
    bookmarks.push({
      date: new Date().toISOString(),
      summary: summaryEl.innerHTML
    });
    chrome.storage.local.set({ bookmarks }, () => {
      alert('Summary bookmarked!');
    });
  });
};

// Initial
showLoading();
requestTranscript(); 