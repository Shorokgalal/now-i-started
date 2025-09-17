import { format, formatDistanceToNowStrict } from "date-fns"

export const secs = (h=0,m=0,s=0) => (h*3600 + m*60 + s)

export const fmtHMS = (total) => {
  const sign = total < 0 ? "-" : ""
  total = Math.abs(total|0)
  const h = Math.floor(total/3600).toString().padStart(2, '0')
  const m = Math.floor(total%3600/60).toString().padStart(2, '0')
  const s = Math.floor(total%60).toString().padStart(2, '0')
  return `${sign}${h}:${m}:${s}`
}

export const rel = (ts) => formatDistanceToNowStrict(ts, { addSuffix: true })

export const hoverDate = (ts) => format(ts, "PPpp")

// Compact relative time like "11m", "3h", "2d", "1w"
export const relShort = (ts) => {
  const t = ts instanceof Date ? ts.getTime() : ts; // accept Date or ms
  const diffSec = Math.max(1, Math.floor((Date.now() - t) / 1000));

  if (diffSec < 3600) return Math.floor(diffSec / 60) + "m";        // < 1h
  if (diffSec < 86400) return Math.floor(diffSec / 3600) + "h";     // < 1d
  if (diffSec < 604800) return Math.floor(diffSec / 86400) + "d";   // < 1w
  return Math.floor(diffSec / 604800) + "w";                         // >= 1w
};
