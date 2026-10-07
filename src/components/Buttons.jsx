import { useState } from "react";
import { Printer, Link2, Check, Copy } from "lucide-react";
import { content } from "../content.js";

const base =
  "inline-flex items-center gap-1.5 rounded-sm border border-rule bg-paper px-2.5 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-ink hover:text-ink";

// Calls window.print(). The print stylesheet in index.css turns the site
// into a flat, formal document. Some embedded viewers block printing,
// so a hint appears after the click explaining the keyboard shortcut.
export function PrintButton({ className = "" }) {
  const [hint, setHint] = useState(false);
  const framed = typeof window !== "undefined" && window.self !== window.top;
  function onClick() {
    try {
      window.print();
    } catch {
      /* some viewers refuse; the hint covers it */
    }
    if (framed) {
      setHint(true);
      window.setTimeout(() => setHint(false), 7000);
    }
  }
  return (
    <span className={`relative inline-flex flex-col items-start gap-1 ${className}`}>
      <button type="button" onClick={onClick} className={base}>
        <Printer size={13} strokeWidth={2} aria-hidden="true" />
        {content.print.buttonLabel}
      </button>
      {hint ? (
        <span role="status" className="max-w-[26ch] text-[12px] normal-case leading-snug tracking-normal text-ink-mute">
          {content.ui.printHint}
        </span>
      ) : null}
    </span>
  );
}

export function CopyLinkButton({ className = "" }) {
  const [done, setDone] = useState(false);
  function onClick() {
    const url = window.location.href;
    const ok = () => {
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(ok).catch(() => fallbackCopy(url, ok));
    } else {
      fallbackCopy(url, ok);
    }
  }
  return (
    <button type="button" onClick={onClick} className={`${base} ${className}`}>
      {done ? <Check size={13} aria-hidden="true" /> : <Link2 size={13} aria-hidden="true" />}
      {done ? content.ui.copied : content.ui.copyLink}
    </button>
  );
}

// Copies an arbitrary value (used for the contact rows).
export function CopyValueButton({ value }) {
  const [done, setDone] = useState(false);
  function onClick() {
    const ok = () => {
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(ok).catch(() => fallbackCopy(value, ok));
    } else {
      fallbackCopy(value, ok);
    }
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-sm border border-rule px-2 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-mute hover:border-ink hover:text-ink"
      aria-label={`${content.ui.copy} ${value}`}
    >
      {done ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
      {done ? content.ui.copied : content.ui.copy}
    </button>
  );
}

function fallbackCopy(text, ok) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    ok();
  } catch {
    /* nothing more to try */
  }
}
