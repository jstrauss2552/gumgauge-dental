/// <reference types="vite/client" />

// Web Speech API (SpeechRecognition) - not in default TypeScript lib
interface SpeechRecognitionEventMap {
  result: SpeechRecognitionEvent;
  end: Event;
  error: SpeechRecognitionErrorEvent;
  start: Event;
  audiostart: Event;
  audioend: Event;
  soundstart: Event;
  soundend: Event;
  speechend: Event;
  nomatch: SpeechRecognitionEvent;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: ((e: Event) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onstart: ((e: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (e: SpeechRecognitionEventMap[K]) => void): void;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  item(i: number): SpeechRecognitionResult;
  [i: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  length: number;
  item(i: number): SpeechRecognitionAlternative;
  [i: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};
declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};
