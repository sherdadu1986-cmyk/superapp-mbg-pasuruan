/**
 * Get today's date string in YYYY-MM-DD format using Asia/Jakarta (WIB) timezone.
 *
 * Uses 'en-CA' locale which natively outputs YYYY-MM-DD format.
 * Explicitly sets timeZone: 'Asia/Jakarta' so it works correctly
 * regardless of the server/browser system timezone setting.
 *
 * This avoids the UTC bug where toISOString() returns yesterday's date
 * between 00:00-06:59 WIB (UTC+7).
 */
export function getLocalToday(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}
