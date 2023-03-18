import { CURRENT_DATETIME, LOCALE } from "@/constants"
import { TransformedLessonWeek } from "@/types/transformed"

export function formatDateForUntis(date: Date) {
	const paddedMonth = (date.getMonth() + 1).toString().padStart(2, '0')
	const paddedDay = date.getDate().toString().padStart(2, '0')
	return `${date.getFullYear()}${paddedMonth}${paddedDay}`
}

export function asNumericTime(date: Date) {
	return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

export function asWeekday(date: Date) {
	return date.toLocaleDateString(LOCALE, { weekday: 'long' })
}

export function getDateInXDays(days: number) {
	const newDate = new Date(CURRENT_DATETIME)
	newDate.setDate(newDate.getDate() + days)
	return newDate
}

export function sortKeysByDate(timetable: TransformedLessonWeek) {
	const keys = Object.keys(timetable)
	return keys.sort((a, b) => {
		return new Date(a).getTime() - new Date(b).getTime()
	})
}

export function getCharHeight(size: number) {
	return size * 1.2
}

export function getCharWidth(size: number) {
	return size * 0.75
}

export function getTextWidth(text: string, fontSize: number) {
	const charWidth = getCharWidth(fontSize)
	// count the number of really narrow characters
	let reallyNarrowCharCount = text.match(/[\|I\.,:; ]/g)?.length ?? 0
	// count the number of narrow characters
	let narrowCharCount = text.match(/[1iljtr]/g)?.length ?? 0
	// count the number of wide characters
	let wideCharCount = text.match(/[wmWM]/g)?.length ?? 0

	let normalCharCount = text.length - reallyNarrowCharCount - narrowCharCount - wideCharCount

	// approximate the width of the text
	return charWidth * (normalCharCount + reallyNarrowCharCount * 0.4 + narrowCharCount * 0.75 + wideCharCount * 1.25)
}

export function asMilliseconds(duration: number, unit: 'seconds' | 'minutes' | 'hours' | 'days') {
	switch (unit) {
		case 'seconds':
			return duration * 1000
		case 'minutes':
			return duration * 60 * 1000
		case 'hours':
			return duration * 60 * 60 * 1000
		case 'days':
			return duration * 24 * 60 * 60 * 1000
	}
}

/**
 * Schedules a notification with the given parameters.
 * @param title
 * @param body
 * @param sound the sound to play, defaults to 'event'
 * @param date the date to schedule the notification for, defaults to 5 seconds from now
 */
export function scheduleNotification(
	title: string,
	body?: string,
	sound?:
		| 'default'
		| 'accept'
		| 'alert'
		| 'complete'
		| 'event'
		| 'failure'
		| 'piano_error'
		| 'piano_success'
		| 'popup',
	date = new Date(Date.now() + 5000)
) {
	const notification = new Notification()

	notification.title = title
	notification.body = body
	notification.sound = sound ?? 'event'

	notification.threadIdentifier = 'untis'
	notification.deliveryDate = date

	notification.schedule()
}

export function getKeyByValue(object: Object, value: any) {
	return Object.keys(object).find((key) => object[key] === value)
}

/**
 * Merges the properties of the source object (may be incomplete) into the target object.
 */
export function deepMerge(target: any, source: any) {
	for (const key in source) {
		if (source[key] instanceof Object && key in target) {
			deepMerge(target[key], source[key])
		} else {
			target[key] = source[key]
		}
	}

	return target
}
