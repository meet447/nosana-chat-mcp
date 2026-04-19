const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatRelativeShort(
  timestamp: number,
  now: number = Date.now(),
): string {
  const diffMs = Math.max(0, now - timestamp);
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);

  const then = new Date(timestamp);
  const today = new Date(now);
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfThen = new Date(then);
  startOfThen.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfThen.getTime()) / 86_400_000,
  );

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24 && diffDays === 0) return `${diffHr}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  const sameYear = then.getFullYear() === today.getFullYear();
  const day = then.getDate();
  const mon = MONTHS[then.getMonth()];
  return sameYear ? `${mon} ${day}` : `${mon} ${day}, ${then.getFullYear()}`;
}

export function formatAbsolute(timestamp: number): string {
  const d = new Date(timestamp);
  const day = d.getDate();
  const mon = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${mon} ${day}, ${year}, ${time}`;
}
