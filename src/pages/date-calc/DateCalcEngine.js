function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysBetween(date1, date2) {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  return Math.abs(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)))
}

export function dateAdd(dateStr, days) {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

export function countWorkdays(startStr, endStr) {
  let start = parseDate(startStr)
  let end = parseDate(endStr)
  if (start > end) [start, end] = [end, start]

  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}
