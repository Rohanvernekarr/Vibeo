// extension/api/gemini.js
class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async summarizeVideo(transcript, videoTitle, duration, options = {}) {
    const prompt = this.buildSummaryPrompt(transcript, videoTitle, duration, options);
    try {
      const response = await fetch(`${this.baseURL}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          })
        });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return this.parseSummaryResponse(data);
    } catch (error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  }

  buildSummaryPrompt(transcript, videoTitle, duration, options) {
    // Build prompt as in the main prompt structure
    let prompt = `Analyze this YouTube video transcript and provide:\n\n1. MAIN SUMMARY (3-5 sentences)\n2. KEY POINTS with timestamps:\n   - [MM:SS] Point description\n3. IMPORTANT QUOTES with exact timing\n4. CHAPTER BREAKDOWN\n5. ACTION ITEMS (if any)\n6. TAGS/CATEGORIES\n\nVideo Title: ${videoTitle}\nDuration: ${duration || 'unknown'}\nTranscript: ${transcript}\n\nFormat response as JSON with this structure:\n{\n  "summary": "...",\n  "keyPoints": [{"timestamp": "MM:SS", "point": "..."}],\n  "quotes": [{"timestamp": "MM:SS", "quote": "..."}],\n  "chapters": [{"start": "MM:SS", "title": "..."}],\n  "tags": ["tag1", "tag2"]\n}`;
    return prompt;
  }

  parseSummaryResponse(data) {
    // Parse Gemini response (expects JSON in text)
    try {
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (e) {
      throw new Error('Failed to parse Gemini response.');
    }
  }
}

// Export for use in extension
if (typeof module !== 'undefined') module.exports = GeminiService; 