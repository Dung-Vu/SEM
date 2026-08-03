// TTS wrapper using Web Speech API — Phase 12.4
// Works in-browser only (SSR safe — checks window)

export interface TTSOptions {
  rate?: number;  // 0.7 = slow, 0.9 = slightly slow, 1.0 = normal
  pitch?: number; // 1.0 = default
  voice?: "en-US" | "en-GB" | "en-AU";
}

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * Returns the list of available speech synthesis voices. On Chrome and iOS
 * Safari the list is loaded asynchronously after the page is ready, so we
 * register a voiceschanged listener the first time and cache the result.
 */
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([]);
  }
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const synth = window.speechSynthesis;
    const initial = synth.getVoices();
    if (initial.length > 0) {
      resolve(initial);
      return;
    }
    let resolved = false;
    const onVoices = () => {
      const v = synth.getVoices();
      if (v.length > 0 && !resolved) {
        resolved = true;
        synth.removeEventListener("voiceschanged", onVoices);
        resolve(v);
      }
    };
    synth.addEventListener("voiceschanged", onVoices);
    // Safety timeout — some browsers never fire voiceschanged.
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        synth.removeEventListener("voiceschanged", onVoices);
        resolve(synth.getVoices());
      }
    }, 1500);
  });

  return voicesPromise;
}

/**
 * Returns a promise that resolves when the utterance ends (or errors out).
 * Useful for callers that need to know when TTS is finished (e.g. to chain
 * actions, or to clear a speaking indicator).
 */
export function speak(text: string, options?: TTSOptions): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }

  // Stop any current speech
  stopSpeech();

  return new Promise<void>((resolve) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.voice ?? "en-US";
    utterance.rate = options?.rate ?? 0.9;
    utterance.pitch = options?.pitch ?? 1.0;

    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    // Pick a matching voice once the list is available.
    const lang = options?.voice ?? "en-US";
    getVoices()
      .then((voices) => {
        const match = voices.find((v) => v.lang === lang) ||
          voices.find((v) => v.lang.startsWith(lang));
        if (match) utterance.voice = match;
        synth.speak(utterance);
      })
      .catch(() => {
        synth.speak(utterance);
      });
  });
}

export function stopSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  return window.speechSynthesis.speaking;
}

export function getTTSSettings(): TTSOptions {
  if (typeof window === "undefined") return { rate: 0.9, voice: "en-US" };
  try {
    const s = JSON.parse(localStorage.getItem("eq-settings") || "{}");
    return {
      rate: s.ttsRate ?? 0.9,
      voice: (s.ttsVoice as TTSOptions["voice"]) ?? "en-US",
    };
  } catch {
    return { rate: 0.9, voice: "en-US" };
  }
}
