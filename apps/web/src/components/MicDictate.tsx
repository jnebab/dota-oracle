import { HERO_BY_ID } from "@dota-oracle/data";
import { parseHeroes } from "@dota-oracle/engine";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in the standard DOM lib).
interface SpeechAlternative {
  transcript: string;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<SpeechAlternative>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
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

  // Stop recognition if the component unmounts mid-listen.
  useEffect(() => {
    return () => recRef.current?.stop();
  }, []);

  const start = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
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
      setFeedback(
        e.error === "not-allowed"
          ? "Mic permission denied — allow microphone access"
          : `Mic error: ${e.error}`,
      );
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    setFeedback(null);
    setListening(true);
    rec.start();
  };

  const stop = () => recRef.current?.stop();

  if (!supported) {
    return (
      <span
        className="fs10 italic"
        style={{ color: "#566070" }}
        title="Try Chrome, Edge, or Android"
      >
        🎤 voice input needs Chrome/Edge
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={listening ? stop : start}
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
      {feedback && (
        <span className="fs10 italic" style={{ color: "#9aa1ad" }}>
          {feedback}
        </span>
      )}
    </div>
  );
}
