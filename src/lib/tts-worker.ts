// TTS Web Worker — runs Kokoro ONNX model off the main thread
// Communicates via postMessage to avoid blocking the UI

const TTS_VOICE = 'bm_george'; // British male — horror Keeper voice

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ttsInstance: any = null;
let cancelled = false;

self.onmessage = async (e: MessageEvent) => {
  const { type } = e.data;

  if (type === 'init') {
    if (ttsInstance) {
      self.postMessage({ type: 'ready' });
      return;
    }
    try {
      // Configure ONNX Runtime BEFORE loading Kokoro:
      // 1. Single-threaded mode — avoids SharedArrayBuffer requirement
      //    (SharedArrayBuffer needs COOP/COEP headers which break CF Access)
      // 2. Disable proxy worker — we're already in a Web Worker,
      //    nested workers can fail and are unnecessary here
      const { env } = await import('@huggingface/transformers');
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.numThreads = 1;
        env.backends.onnx.wasm.proxy = false;
      }

      const { KokoroTTS } = await import('kokoro-js');
      ttsInstance = await KokoroTTS.from_pretrained(
        'onnx-community/Kokoro-82M-v1.0-ONNX',
        {
          dtype: 'q8' as const,
          device: 'wasm' as const,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          progress_callback: (p: any) => {
            if (p?.progress != null) {
              self.postMessage({ type: 'progress', progress: Math.round(p.progress) });
            }
          },
        }
      );
      // Clear any stale cancel flag from stopSpeech() called during init
      cancelled = false;
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', id: null, message: String(err) });
    }
  }

  if (type === 'generate') {
    const { id, text, voice } = e.data;
    if (!ttsInstance) {
      self.postMessage({ type: 'error', id, message: 'TTS not initialized' });
      return;
    }
    if (cancelled) {
      cancelled = false;
      return;
    }
    try {
      const audio = await ttsInstance.generate(text, { voice: voice || TTS_VOICE });
      if (cancelled) {
        cancelled = false;
        return;
      }
      const pcmData = audio?.audio;
      if (!pcmData || pcmData.length === 0) {
        self.postMessage({ type: 'error', id, message: 'Empty audio output' });
        return;
      }
      // Transfer the Float32Array (zero-copy)
      const floatData = pcmData instanceof Float32Array ? pcmData : new Float32Array(pcmData);
      self.postMessage(
        { type: 'audio', id, pcmData: floatData, sampleRate: audio.sampling_rate || 24000 },
        { transfer: [floatData.buffer] }
      );
    } catch (err) {
      if (!cancelled) {
        self.postMessage({ type: 'error', id, message: String(err) });
      }
      cancelled = false;
    }
  }

  if (type === 'cancel') {
    cancelled = true;
  }
};
