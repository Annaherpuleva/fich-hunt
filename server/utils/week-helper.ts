export function getWeekStartDate(): string {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Calculate days to subtract to get to Monday
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  // Use millisecond arithmetic instead of setDate() to avoid month rollover issues
  const weekStartMs = now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000
  const weekStart = new Date(weekStartMs)

  // Format as YYYY-MM-DD without timezone issues
  const year = weekStart.getFullYear()
  const month = String(weekStart.getMonth() + 1).padStart(2, "0")
  const date = String(weekStart.getDate()).padStart(2, "0")

  return `${year}-${month}-${date}`
}

export function getWeekEndDate(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const weekStartMs = now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000
  const weekStart = new Date(weekStartMs)

  // Add 7 days for week end (Sunday) using milliseconds
  const weekEndMs = weekStart.getTime() + 6 * 24 * 60 * 60 * 1000

  const weekEnd = new Date(weekEndMs)
  const year = weekEnd.getFullYear()
  const month = String(weekEnd.getMonth() + 1).padStart(2, "0")
  const date = String(weekEnd.getDate()).padStart(2, "0")

  return `${year}-${month}-${date}`
}

export function getWeekStartAndEnd() {
  return {
    weekStart: getWeekStartDate(),
    weekEnd: getWeekEndDate(),
  }
}
