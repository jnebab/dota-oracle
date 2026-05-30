import { HERO_BY_ID } from "@dota-oracle/data";
import { parseHeroes } from "@dota-oracle/engine";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in the standard DOM lib).
interface SpeechAlternative {
  transcript: string;
}
interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<SpeechAlternative>>;
}
interface SpeechErrorEvent {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_TEXT: Record<string, string> = {
  "not-allowed": "Mic permission denied — allow microphone access",
  "service-not-allowed": "Mic permission denied — allow microphone access",
  "no-speech": "Didn't catch that — tap and try again",
  "audio-capture": "No microphone found",
  network: "Network error reaching the speech service",
};

interface MicDictateProps {
  targetLabel: string;
  accent: string;
  onHeroes: (ids: string[]) => void;
}

export function MicDictate({ targetLabel, accent, onHeroes }: MicDictateProps) {
  const [supported] = useState(() => recognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  // Tear down any active recognition cleanly (used on replace + unmount).
  const teardown = () => {
    const rec = recRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.abort();
      recRef.current = null;
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: teardown is stable for our use
  useEffect(() => teardown, []);

  const start = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    // Abort any in-flight recognition before starting a fresh one so an
    // orphaned instance can't fire callbacks and flip state out of band.
    teardown();

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    // Guard: only the instance that is still current may touch state.
    const isCurrent = () => recRef.current === rec;

    rec.onresult = (e) => {
      if (!isCurrent()) return;
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      const ids = parseHeroes(transcript);
      if (ids.length > 0) {
        onHeroes(ids);
        const names = ids.map((id) => HERO_BY_ID[id]?.name ?? id).join(", ");
        setFeedback(`Added: ${names}`);
      } else {
        setFeedback(`Heard "${transcript.trim() || "…"}" — no heroes matched`);
      }
    };
    rec.onerror = (e) => {
      if (!isCurrent()) return;
      if (e.error === "aborted") return; // expected on manual stop/replace
      setFeedback(ERROR_TEXT[e.error] ?? `Mic error: ${e.error}`);
    };
    rec.onend = () => {
      if (!isCurrent()) return;
      setListening(false);
      recRef.current = null;
    };

    recRef.current = rec;
    setFeedback(null);
    setListening(true);
    rec.start();
  };

  const stop = () => recRef.current?.stop();

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className="fs10 italic"
        style={{ color: "#566070", background: "transparent", border: "none", cursor: "default" }}
        aria-label="Voice input is not supported in this browser; try Chrome, Edge, or Android"
        title="Try Chrome, Edge, or Android Chrome"
      >
        🎤 voice input needs Chrome/Edge
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-pressed={listening}
        aria-label={
          listening ? "Stop dictating heroes" : `Dictate heroes into ${targetLabel} by voice`
        }
        className="oracle-display fs11 flex items-center gap-1 rounded-md px-2.5 py-1.5 tracking-wide"
        style={{
          color: listening ? "#0b0d10" : accent,
          background: listening ? accent : "rgba(255,255,255,.04)",
          border: `1px solid ${accent}${listening ? "" : "55"}`,
        }}
        title={`Dictate heroes into ${targetLabel}`}
      >
        {listening ? <MicOff size={13} /> : <Mic size={13} />}
        {listening ? "Listening…" : "Dictate"}
      </button>
      <output aria-live="polite" className="fs10 italic" style={{ color: "#9aa1ad" }}>
        {feedback}
      </output>
    </div>
  );
}
