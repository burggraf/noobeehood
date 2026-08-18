/**
 * @param {string | number} value
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatVerificationDate(value, locale = 'en-US') {
	const date = new Date(value);
	return Number.isNaN(date.valueOf())
		? 'Date unavailable'
		: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}
