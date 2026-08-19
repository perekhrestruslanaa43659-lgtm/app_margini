// Due fasce orarie si sovrappongono se iniziano prima che l'altra finisca, su entrambi i lati.
// Se uno dei due eventi non ha un orario impostato, si considera "tutto il giorno" (occupa sempre).
export function timeRangesOverlap(
  aStart: string | null,
  aEnd: string | null,
  bStart: string | null,
  bEnd: string | null
): boolean {
  if (!aStart || !aEnd || !bStart || !bEnd) return true
  return aStart < bEnd && bStart < aEnd
}

export function formatTimeRange(start: string | null, end: string | null): string {
  if (!start && !end) return 'Tutto il giorno'
  const s = start ? start.slice(0, 5) : '?'
  const e = end ? end.slice(0, 5) : '?'
  return `${s} – ${e}`
}
