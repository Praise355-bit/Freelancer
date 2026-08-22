// /api/groq.js
// Vercel serverless function (Node runtime). Deploy this file at that exact
// path in your project and it becomes reachable at POST /api/groq.
//
// Set GROQ_API_KEY as an environment variable in your Vercel project
// settings (Project Settings -> Environment Variables). Never put the key
// in the frontend code.
//
// Get a key at https://console.groq.com

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing GROQ_API_KEY' });
  }

  const { system = '', prompt = '', json = false, temperature = 0.7, max_tokens = 1500 } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Missing "prompt" in request body' });
  }

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const body = {
    model: 'llama-3.3-70b-versatile', // swap for any current Groq-hosted model
    messages,
    temperature,
    max_tokens
  };

  // Ask Groq to guarantee valid JSON back when the caller wants structured data.
  if (json) {
    body.response_format = { type: 'json_object' };
  }

  try {
    const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await groqResp.json();

    if (!groqResp.ok) {
      return res.status(groqResp.status).json({ error: data.error?.message || 'Groq request failed' });
    }

    const content = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ content });
  } catch (err) {
    console.error('Groq proxy error:', err);
    return res.status(502).json({ error: 'Failed to reach Groq' });
  }
}
