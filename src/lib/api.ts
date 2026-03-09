import type { ChatMessage, Investigator, Scenario } from './types';

const API_URL = 'https://ertxfqfdheukcrzlajlm.supabase.co/functions/v1/game-master';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVydHhmcWZkaGV1a2NyemxhamxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjE1MDIsImV4cCI6MjA4ODU5NzUwMn0.SSWoxs4wIBhB4Lp12HV0dndJiawBZcBT0lHmSUxTP-k';

interface StreamOptions {
  messages: ChatMessage[];
  scenario: Scenario;
  investigator: Investigator;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}

export async function streamGameMaster({
  messages,
  scenario,
  investigator,
  onDelta,
  onDone,
  onError,
}: StreamOptions) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ messages, scenario, investigator }),
    });

    if (response.status === 429) {
      onError('Rate limit reached \u2014 please wait a moment and try again.');
      return;
    }
    if (response.status === 402) {
      onError('AI credits exhausted. Add credits in workspace settings.');
      return;
    }
    if (!response.ok || !response.body) {
      onError('Failed to connect to the Keeper.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let done = false;

    while (!done) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '' || !line.startsWith('data: ')) continue;

        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          done = true;
          break;
        }

        try {
          const content = JSON.parse(data)?.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      for (let line of buffer.split('\n')) {
        if (!line) continue;
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '' || !line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const content = JSON.parse(data)?.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* skip */ }
      }
    }

    onDone();
  } catch (err) {
    console.error('Stream error:', err);
    onError('Connection lost. Please try again.');
  }
}
