// Simple AI proxy for the client app
// Usage: set PROVIDER_URL and PROVIDER_KEY in .env, then run `node server/index.js`

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PROVIDER_URL = process.env.PROVIDER_URL; // e.g. https://api.your-llm-provider/v1/generate
const PROVIDER_KEY = process.env.PROVIDER_KEY;

function readNotesPrompt() {
  try {
    const notesPath = path.resolve(__dirname, '..', 'notes.txt');
    return fs.readFileSync(notesPath, 'utf8');
  } catch (e) {
    console.warn('Could not read notes.txt:', e.message);
    return '';
  }
}

// Normalize response text extractor
function extractTextFromProviderResponse(json) {
  if (!json) return null;
  if (typeof json === 'string') return json;
  if (json.output) return json.output;
  if (json.text) return json.text;
  if (json.result) return json.result;
  if (Array.isArray(json.generations) && json.generations[0] && json.generations[0].text) return json.generations[0].text;
  if (json.choices && json.choices[0] && json.choices[0].text) return json.choices[0].text;
  return JSON.stringify(json);
}

app.post('/api/llama', async (req, res) => {
  try {
    const { prompt, userWords, chapterNumber, lang, model, max_tokens, temperature } = req.body || {};

    // Build final prompt: prefer explicit prompt, otherwise combine notes.txt and userWords
    let finalPrompt = prompt;
    if (!finalPrompt && userWords) {
      const notes = readNotesPrompt();
      finalPrompt = `${notes}\n\nConvert the following user-provided words into a JSON chapter object for language '${lang || 'de'}'.\nThe JSON must be exactly in this structure (no extra text):\n{\n  \"chapter\": ${chapterNumber || 0},\n  \"title\": \"Chapter ${chapterNumber || ''}\",\n  \"words\": [\n    { \"german\": \"...\", \"english\": \"...\", \"clue\": \"...\" },\n    ...\n  ]\n}\n\nHere are the words (one per line):\n${userWords}\n\nRespond with valid JSON only.`;
    }

    if (!PROVIDER_URL) return res.status(500).json({ error: 'PROVIDER_URL not configured on server. Set PROVIDER_URL in server/.env' });

    const bodyToProvider = {
      prompt: finalPrompt,
      model: model || process.env.MODEL || 'llama-3.1-instruct',
      max_tokens: max_tokens || 1200,
      temperature: typeof temperature !== 'undefined' ? temperature : 0.2
    };

    const headers = { 'Content-Type': 'application/json' };
    if (PROVIDER_KEY) headers['Authorization'] = `Bearer ${PROVIDER_KEY}`;

    const fetch = global.fetch || require('node-fetch');
    const providerResp = await fetch(PROVIDER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyToProvider)
    });

    const providerJson = await providerResp.json();
    const text = extractTextFromProviderResponse(providerJson);

    res.json({ success: true, text, raw: providerJson });
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI proxy listening on http://localhost:${PORT}`));
