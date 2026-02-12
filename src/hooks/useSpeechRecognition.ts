import { useState, useCallback, useRef, useEffect } from "react";

const SpeechRecognitionAPI =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition);

export function useSpeechRecognition(options?: { onFinalTranscript?: (text: string) => void; lang?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalRef = useRef(options?.onFinalTranscript);
  onFinalRef.current = options?.onFinalTranscript;

  const isSupported = !!SpeechRecognitionAPI;

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    setError(null);
    const rec = new SpeechRecognitionAPI() as SpeechRecognition;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = options?.lang ?? "en-US";
    rec.maxAlternatives = 1;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      if (interim) setInterimTranscript(interim);
      if (finalText && onFinalRef.current) {
        onFinalRef.current(finalText);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed") {
        setError("Microphone access was denied.");
      } else if (e.error === "no-speech") {
        // User may have stopped talking; don’t show as fatal
        setError(null);
      } else {
        setError(e.message || "Speech recognition error.");
      }
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start recognition.");
    }
  }, [options?.lang]);

  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isSupported, isListening, interimTranscript, error, start, stop };
}

/** Turn a transcript string into concise bullet points (client-side, no API). */
export function transcriptToBulletPoints(transcript: string): string {
  if (!transcript.trim()) return "";
  const raw = transcript.trim();
  const sentences = raw
    .split(/\n|[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  const seen = new Set<string>();
  const bullets: string[] = [];
  for (const s of sentences) {
    const key = s.slice(0, 50).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    bullets.push("• " + s.replace(/^[\s•\-]+/, ""));
  }
  return bullets.join("\n");
}
