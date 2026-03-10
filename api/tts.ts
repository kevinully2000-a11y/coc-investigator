import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'TTS service not configured (missing API key)' });
    }

    const { text, voice = 'onyx', speed = 0.92 } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    // Cap input to avoid runaway costs (TTS-1 limit is 4096 chars)
    const input = text.slice(0, 4096);

    // Lazy-init OpenAI client (avoids module-level crash if key missing)
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey });

    const mp3 = await client.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'onyx' | 'alloy' | 'echo' | 'fable' | 'nova' | 'shimmer',
      input,
      response_format: 'mp3',
      speed,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'TTS generation failed';
    console.error('TTS API error:', message);
    res.status(500).json({ error: message });
  }
}
