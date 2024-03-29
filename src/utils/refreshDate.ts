import { CURRENT_DATETIME } from '@/constants'
import { Settings } from '@/settings/settings'
import { TransformedLesson } from '@/types/transformed'

/**
 * Find out when to refresh the widget based on the content.
 */
export function getRefreshDateForLessons(
	lessonsTodayRemaining: TransformedLesson[],
	lessonsTomorrow: TransformedLesson[],
	widgetConfig: Settings
) {
	let nextRefreshDate: Date

	// set the widget refresh time to the end of the current lesson, or the next lesson if there is only a short break
	if (lessonsTodayRemaining.length >= 1) {
		const firstLesson = lessonsTodayRemaining[0]
		const secondLesson = lessonsTodayRemaining[1]

		// if the next lesson has not started yet
		if (firstLesson.from > CURRENT_DATETIME) {
			nextRefreshDate = firstLesson.from
			console.log(
				`Would refresh at the start of the next lesson at ${nextRefreshDate}, as it has not started yet`
			)
		} else {
			// if the break is too short
			if (
				secondLesson &&
				secondLesson.from.getTime() - firstLesson.to.getTime() < widgetConfig.config.breakMax * 1000
			) {
				nextRefreshDate = secondLesson.from
				console.log(
					`Would refresh at the start of the next lesson at ${nextRefreshDate}, as the break is too short.`
				)
			} else {
				nextRefreshDate = firstLesson.to
				console.log(
					`Would refresh at the end of the current lesson at ${nextRefreshDate}, as there is a long enough break.`
				)
			}
		}
	} else {
		let shouldLazyUpdate = true

		// if the next lesson (on the next day) is in the scope of the frequent updates
		if (lessonsTomorrow && lessonsTomorrow.length > 1) {
			const timeUntilNextLesson = lessonsTomorrow[0].from.getTime() - CURRENT_DATETIME.getTime()
			shouldLazyUpdate = timeUntilNextLesson > widgetConfig.refresh.normalScope * 1000
		}

		// refresh based on normal/lazy refreshing
		if (shouldLazyUpdate) {
			console.log(`Would refresh in ${widgetConfig.refresh.lazyInterval} minutes (lazy updating).`)
			nextRefreshDate = new Date(CURRENT_DATETIME.getTime() + widgetConfig.refresh.lazyInterval * 1000)
		} else {
			console.log(`Would refresh in ${widgetConfig.refresh.normalInterval} minutes (normal updating).`)
			nextRefreshDate = new Date(CURRENT_DATETIME.getTime() + widgetConfig.refresh.normalInterval * 1000)
		}
	}

	return nextRefreshDate
}
