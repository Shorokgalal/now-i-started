// src/components/ui/QAWidgets.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

/* ---------------- Small helpers ---------------- */
export const initialOf = (name = "U") =>
  (String(name).trim()[0] || "U").toUpperCase();

export const nameFromEmail = (email = "") =>
  (String(email).split("@")[0] || "User");

export function asDate(ts) {
  return ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts || Date.now()));
}

export function fmtDate(ts) {
  try {
    const d = asDate(ts);
    return d.toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function timeAgo(ts) {
  const d = asDate(ts);
  const ms = Date.now() - d.getTime();
  const min = 60_000, hr = 60 * min, day = 24 * hr, wk = 7 * day;
  if (ms < hr) return `${Math.max(1, Math.floor(ms / min))}m`;
  if (ms < day) return `${Math.floor(ms / hr)}h`;
  if (ms < wk) return `${Math.floor(ms / day)}d`;
  return `${Math.floor(ms / wk)}w`;
}

export function fullDate(ts) {
  const d = asDate(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* --------------- UI pieces ---------------- */

export function HoverTime({ ts }) {
  const d = asDate(ts);
  return (
    <span className="relative inline-block group">
      <time
        className="text-xs text-text/60 cursor-default"
        dateTime={d.toISOString()}
      >
        {timeAgo(ts)}
      </time>

      {/* tooltip bubble */}
      <span
        className="
          pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2
          mb-1 whitespace-nowrap rounded bg-black/80 px-2 py-1
          text-[10px] leading-tight text-white opacity-0
          transition-opacity duration-150
          group-hover:opacity-100
        "
      >
        {fullDate(ts)}
      </span>
    </span>
  );
}

/** Reaction (❤) button that listens to its own subcollection */
export function ReactionButton({ messageId, uid, className = "" }) {
  const [count, setCount] = useState(0);
  const [mine, setMine] = useState(false);

  useEffect(() => {
    if (!messageId) return () => {};
    const ref = collection(db, "qaMessages", messageId, "reactions");
    const unsub = onSnapshot(ref, (snap) => {
      let n = 0;
      let hasMine = false;
      snap.forEach((d) => {
        n += 1;
        if (uid && d.id === uid) hasMine = true;
      });
      setCount(n);
      setMine(hasMine);
    });
    return () => unsub();
  }, [messageId, uid]);

  async function toggle() {
    if (!uid || !messageId) return;
    const myRef = doc(db, "qaMessages", messageId, "reactions", uid);
    if (mine) await deleteDoc(myRef);
    else await setDoc(myRef, { at: serverTimestamp() });
  }

  const base =
    "px-2.5 py-1 rounded-full border text-sm transition " +
    (mine
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "hover:bg-muted/50");

  return (
    <button
      onClick={toggle}
      className={`${base} ${className}`}
      aria-label="React"
      title={uid ? "React" : "Sign in to react"}
      disabled={!uid}
    >
      ❤️ {count}
    </button>
  );
}

/** Tiny avatar that falls back to initial */
export function Avatar({ src, name, className = "" }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || "User"}
        className={`h-8 w-8 rounded-full object-cover border border-ring ${className}`}
      />
    );
  }
  return (
    <div
      className={`h-8 w-8 rounded-full grid place-items-center border border-ring bg-accent/10 text-accent text-sm font-semibold ${className}`}
    >
      {initialOf(name)}
    </div>
  );
}

/** Body text with clamp + See more/less */
export function MessageText({
  text,
  alignRight = false,
  clampLines = 3,
}) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = (text || "").length > 220;

  const style = expanded
    ? {}
    : {
        display: "-webkit-box",
        WebkitLineClamp: String(clampLines),
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };

  return (
    <div className={alignRight ? "text-right" : ""}>
      <div className="text-sm leading-relaxed whitespace-pre-wrap" style={style}>
        {text}
      </div>
      {needsToggle && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs underline mt-1"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
