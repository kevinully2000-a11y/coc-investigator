// TTS Web Worker — runs Kokoro ONNX model off the main thread
// Uses WebGPU when available (5-10x faster), falls back to single-thread WASM

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
      // Detect WebGPU for much faster inference
      let device: 'webgpu' | 'wasm' = 'wasm';
      if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const adapter = await (navigator as any).gpu.requestAdapter();
          if (adapter) device = 'webgpu';
        } catch { /* WebGPU not available */ }
      }

      // For WASM: single-threaded mode (SharedArrayBuffer needs COOP/COEP
      // headers which break CF Access auth)
      if (device === 'wasm') {
        const { env } = await import('@huggingface/transformers');
        if (env.backends?.onnx?.wasm) {
          env.backends.onnx.wasm.numThreads = 1;
          env.backends.onnx.wasm.proxy = false;
        }
      }

      const { KokoroTTS } = await import('kokoro-js');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const progressCb = (p: any) => {
        if (p?.progress != null) {
          // Scale to 0-85% for model load, 85-100% for warmup
          self.postMessage({ type: 'progress', progress: Math.round(p.progress * 0.85) });
        }
      };

      // Try preferred device, fall back to WASM if it fails
      try {
        ttsInstance = await KokoroTTS.from_pretrained(
          'onnx-community/Kokoro-82M-v1.0-ONNX',
          { dtype: 'q8' as const, device, progress_callback: progressCb }
        );
      } catch (loadErr) {
        if (device === 'webgpu') {
          // WebGPU failed — fall back to single-thread WASM
          const { env } = await import('@huggingface/transformers');
          if (env.backends?.onnx?.wasm) {
            env.backends.onnx.wasm.numThreads = 1;
            env.backends.onnx.wasm.proxy = false;
          }
          device = 'wasm';
          ttsInstance = await KokoroTTS.from_pretrained(
            'onnx-community/Kokoro-82M-v1.0-ONNX',
            { dtype: 'q8' as const, device, progress_callback: progressCb }
          );
        } else {
          throw loadErr;
        }
      }

      // Warm up ONNX runtime — first inference compiles WASM/GPU kernels
      // and is 3-4x slower. Running a throwaway generation here moves that
      // cost into the loading phase so the user's first real sentence is fast.
      self.postMessage({ type: 'progress', progress: 90 });
      await ttsInstance.generate('Ready.', { voice: TTS_VOICE });

      cancelled = false;
      self.postMessage({ type: 'ready', device });
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
