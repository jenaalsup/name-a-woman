"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createMatcher } from "@/lib/match";
import type { Entry } from "@/lib/types";

const GAME_SECONDS = 180;

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function createInitialState() {
  return {
    timeLeft: GAME_SECONDS,
    input: "",
    found: [] as Entry[],
    message: "",
    isOver: false,
  };
}

type GameProps = {
  title: string;
  entries: Entry[];
};

export default function Game({ title, entries }: GameProps) {
  const match = useMemo(() => createMatcher(entries), [entries]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [input, setInput] = useState("");
  const [found, setFound] = useState<Entry[]>([]);
  const [message, setMessage] = useState("");
  const [isOver, setIsOver] = useState(false);

  const foundIds = useMemo(() => new Set(found.map((entry) => entry.id)), [found]);

  function resetGame() {
    const initial = createInitialState();
    setTimeLeft(initial.timeLeft);
    setInput(initial.input);
    setFound(initial.found);
    setMessage(initial.message);
    setIsOver(initial.isOver);
  }

  useEffect(() => {
    if (isOver) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setIsOver(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOver]);

  useEffect(() => {
    if (!isOver) inputRef.current?.focus();
  }, [isOver]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isOver || !input.trim()) return;

    const result = match(input, foundIds);

    if (result.status === "found") {
      setFound((current) =>
        [...current, result.entry].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setMessage(`Added ${result.entry.name}`);
    } else if (result.status === "duplicate") {
      setMessage(`Already got ${result.entry.name}`);
    } else {
      setMessage("Not recognized");
    }

    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-baseline justify-between">
        <Link href="/" className="text-sm text-[#6b6080] underline underline-offset-2">
          Home
        </Link>
        <span className="font-mono text-xl tabular-nums">{formatTime(timeLeft)}</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-[#6b6080]">
          {isOver ? "Time's up." : "Score: "}
          {!isOver && <span className="text-foreground">{found.length}</span>}
        </p>
      </div>

      {!isOver ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a name"
            className="w-full border-b border-[#c4b8d9] bg-transparent py-2 text-lg outline-none placeholder:text-[#9b91ad]"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {message && <p className="text-sm text-[#6b6080]">{message}</p>}
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          <p>Final score: {found.length}</p>
          <button
            type="button"
            onClick={resetGame}
            className="w-fit underline underline-offset-4"
          >
            Play again
          </button>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm text-[#6b6080]">Found ({found.length})</p>
        {found.length === 0 ? (
          <p className="text-sm text-[#9b91ad]">None yet</p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
            {found.map((entry) => (
              <li key={entry.id}>{entry.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
