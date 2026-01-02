'use client';

import { FormEvent, useMemo, useState } from "react";

type PlatformSuggestion = {
  platform: string;
  handles: string[];
  highlight: string;
};

type BaseTokens = {
  raw: string;
  tokens: string[];
  compact: string;
  snake: string;
  hybrid: string;
};

const PLATFORM_CONFIGS = [
  {
    platform: "Instagram",
    prefixes: ["", "its", "hello", "meet"],
    suffixes: ["gram", "daily", "studio", "journal", "pixels"],
    highlight: "Keep it aesthetic and easy to read.",
  },
  {
    platform: "TikTok",
    prefixes: ["", "hey", "go", "watch"],
    suffixes: ["tok", "loops", "clips", "beats", "motion"],
    highlight: "Short, punchy names work best here.",
  },
  {
    platform: "X (Twitter)",
    prefixes: ["", "real", "the", "its"],
    suffixes: ["hq", "updates", "live", "now", "feed"],
    highlight: "Fast takes + credibility are key.",
  },
  {
    platform: "YouTube",
    prefixes: ["", "watch", "team", "channel"],
    suffixes: ["tv", "studio", "lab", "vision", "vault"],
    highlight: "Think long-form and memorable.",
  },
  {
    platform: "Threads",
    prefixes: ["", "join", "hello", "with"],
    suffixes: ["threads", "loop", "lane", "space", "waves"],
    highlight: "Friendly conversational handles stand out.",
  },
] as const;

function normalizeName(rawName: string) {
  return rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toBaseTokens(name: string): BaseTokens | null {
  const normalized = normalizeName(name);
  if (!normalized) {
    return null;
  }

  const tokens = normalized.split(" ");
  if (!tokens.length) {
    return null;
  }

  const compact = tokens.join("").toLowerCase();

  const snake = tokens.map((token) => token.toLowerCase()).join("_");
  const hybrid =
    tokens[0].toLowerCase() +
    tokens
      .slice(1)
      .map((token) => token[0].toUpperCase() + token.slice(1).toLowerCase())
      .join("");

  return {
    raw: normalized,
    tokens,
    compact,
    snake,
    hybrid,
  };
}

function hashString(input: string, salt: number) {
  let hash = 0;
  const value = `${input}:${salt}`;

  for (let index = 0; index < value.length; index += 1) {
    const charCode = value.charCodeAt(index);
    hash = (hash << 5) - hash + charCode;
    hash |= 0;
  }

  return Math.abs(hash);
}

function composeHandle(
  tokens: BaseTokens,
  prefix: string,
  suffix: string,
  style: "compact" | "snake" | "hybrid",
  salt: number,
) {
  const base =
    style === "snake"
      ? tokens.snake
      : style === "hybrid"
        ? tokens.hybrid
        : tokens.compact;

  const prefixPart = prefix ? prefix.replace(/[^a-z0-9]/gi, "") : "";
  const suffixPart = suffix ? suffix.replace(/[^a-z0-9]/gi, "") : "";

  const rawHandle = `${prefixPart}${base}${suffixPart}`.toLowerCase();
  const trimmed = rawHandle.slice(0, 20);

  if (trimmed.length >= 4) {
    return trimmed;
  }

  return `${trimmed}${salt % 1000}`;
}

function generateSuggestions(name: string, salt: number) {
  const parsed = toBaseTokens(name);

  if (!parsed) {
    return [];
  }

  const suggestions: PlatformSuggestion[] = [];

  for (const config of PLATFORM_CONFIGS) {
    const platformSeed =
      hashString(`${config.platform}:${parsed.raw}`, salt) % 9973;
    const handles = new Set<string>();

    const styles: Array<"compact" | "snake" | "hybrid"> = [
      "compact",
      "snake",
      "hybrid",
    ];

    let attempt = 0;
    while (handles.size < 3 && attempt < 15) {
      const style = styles[(platformSeed + attempt) % styles.length];
      const prefix =
        config.prefixes[
          (platformSeed + attempt * 3) % config.prefixes.length
        ];
      const suffix =
        config.suffixes[
          (platformSeed + attempt * 5) % config.suffixes.length
        ];

      const candidate = composeHandle(parsed, prefix, suffix, style, salt);

      if (candidate.length >= 4) {
        handles.add(candidate);
      }

      attempt += 1;
    }

    if (handles.size < 3) {
      handles.add(composeHandle(parsed, "", "", "compact", salt + 1));
    }

    suggestions.push({
      platform: config.platform,
      handles: Array.from(handles).map((handle) => `@${handle}`),
      highlight: config.highlight,
    });
  }

  return suggestions;
}

export default function Home() {
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [salt, setSalt] = useState(() => Date.now());

  const suggestions = useMemo(() => {
    if (!submittedName) {
      return [];
    }

    return generateSuggestions(submittedName, salt);
  }, [salt, submittedName]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setSubmittedName(null);
      return;
    }

    setSubmittedName(name.trim());
    setSalt(Date.now());
  };

  const handleRemix = () => {
    if (!submittedName) {
      return;
    }

    setSalt(Date.now());
  };

  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-br from-sky-950 via-slate-900 to-zinc-900 px-6 py-16 text-slate-50">
      <div className="flex w-full max-w-5xl flex-col gap-12">
        <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center sm:items-start sm:text-left">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-widest text-slate-200">
            Handle Agent
          </span>
          <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
            Tell me your name and I&apos;ll craft handles that land on every
            platform.
          </h1>
          <p className="text-pretty text-slate-300 sm:text-lg">
            Drop a name, brand, or vibe. I&apos;ll instantly pitch handles
            tailored for Instagram, TikTok, X, YouTube, and Threads—no more
            guesswork or endless availability checks.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-sky-950/20 backdrop-blur"
        >
          <label className="text-sm font-medium uppercase tracking-wider text-slate-200">
            What should people call you?
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Lunar Labs"
              className="w-full rounded-2xl border border-white/20 bg-slate-950/60 px-4 py-4 text-base text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
            <button
              type="submit"
              className="flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-4 text-base font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
            >
              Generate handles
            </button>
          </div>
          {submittedName && (
            <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3">
              <span className="text-xs uppercase tracking-wider text-slate-400">
                Agent update
              </span>
              <p className="text-sm text-slate-200">
                Got it — searching every feed for{" "}
                <span className="font-semibold text-white">{submittedName}</span>
                . Here&apos;s what stands out right now.
              </p>
            </div>
          )}
        </form>

        {suggestions.length > 0 && (
          <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Platform-ready suggestions
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRemix}
                  type="button"
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  Remix handles
                </button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {suggestions.map((suggestion) => (
                <article
                  key={suggestion.platform}
                  className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-6 shadow-lg shadow-black/30"
                >
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {suggestion.platform}
                      </h3>
                      <p className="text-sm text-slate-300">
                        {suggestion.highlight}
                      </p>
                    </div>
                    <span className="rounded-full border border-sky-500/40 bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-200">
                      Agent picks
                    </span>
                  </header>
                  <ul className="flex flex-col gap-2">
                    {suggestion.handles.map((handle) => (
                      <li
                        key={handle}
                        className="group flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base font-medium text-white transition hover:border-sky-400/70 hover:bg-sky-500/10"
                      >
                        <span>{handle}</span>
                        <CopyButton value={handle} />
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {!suggestions.length && (
          <section className="mx-auto w-full max-w-4xl rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 text-slate-200">
            <h2 className="text-xl font-semibold text-white">
              I&apos;m ready when you are.
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Drop a name to explore handles across platforms. I&apos;ll balance
              vibe, readability, and availability best practices so you can move
              straight to claiming.
            </p>
            <p className="mt-4 text-xs uppercase tracking-widest text-slate-500">
              Tip · Try nicknames, keywords, or a mission statement.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

type CopyButtonProps = {
  value: string;
};

function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (!("clipboard" in navigator)) {
        return;
      }

      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-100 transition group-hover:border-sky-400/70 group-hover:bg-sky-500/20 focus:outline-none focus:ring-2 focus:ring-sky-300"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
