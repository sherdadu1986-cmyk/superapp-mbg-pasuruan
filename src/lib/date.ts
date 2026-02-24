/**
 * Get today's date string in YYYY-MM-DD format using local timezone (Asia/Jakarta).
 * This avoids the UTC bug where toISOString() returns yesterday's date
 * between 00:00–06:59 WIB (UTC+7).
 */
export function getLocalToday(): string {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}
