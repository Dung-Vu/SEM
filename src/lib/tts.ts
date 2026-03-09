// TTS wrapper using Web Speech API — Phase 12.4
// Works in-browser only (SSR safe — checks window)

export interface TTSOptions {
  rate?: number;  // 0.7 = slow, 0.9 = slightly slow, 1.0 = normal
  pitch?: number; // 1.0 = default
  voice?: "en-US" | "en-GB" | "en-AU";
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string, options?: TTSOptions): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Stop any current speech
  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options?.voice ?? "en-US";
  utterance.rate = options?.rate ?? 0.9;
  utterance.pitch = options?.pitch ?? 1.0;

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  const lang = options?.voice ?? "en-US";
  const match = voices.find((v) => v.lang.startsWith(lang));
  if (match) utterance.voice = match;

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
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
