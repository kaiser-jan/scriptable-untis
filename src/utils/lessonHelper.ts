import { Settings } from '@/settings/settings'
import { LessonState } from '@/types/api'
import { TransformedLesson } from '@/types/transformed'

export function filterCanceledLessons(lessons: TransformedLesson[]) {
	// filter out lessons which don't take place
	return lessons.filter((lesson) => {
		if (lesson.state === LessonState.FREE || lesson.state === LessonState.CANCELED) return false
		if (lesson.state === LessonState.RESCHEDULED && lesson.rescheduleInfo?.isSource) return false
		return true
	})
}

/**
 * Compares two lessons and returns if they can be combined.
 * If ignoreDetails is true, only subject name and time will be compared.
 * @param ignoreDetails if the comparison should only consider subject and time
 */
export function shouldCombineLessons(
	a: TransformedLesson,
	b: TransformedLesson,
	widgetConfig: Settings,
	ignoreDetails = false,
	ignoreBreaks = false
) {
	if (a.subject?.name !== b.subject?.name) return false
	if (!ignoreBreaks && b.from.getTime() - a.to.getTime() > widgetConfig.config.breakMin * 1000) return false

	if (ignoreDetails) return true

	// check if the lessons are equal, ignoring the duration and time (as those are changed when combining)
	const ignoredEqualKeys = ['duration', 'break', 'to', 'from', 'id']
	const keyIgnorer = (key: string, value: any) => (ignoredEqualKeys.includes(key) ? undefined : value)
	return JSON.stringify(a, keyIgnorer) === JSON.stringify(b, keyIgnorer)
}

/**
 * Returns a title for a subject following an order based on what is available.
 */
export function getSubjectTitle(lesson: TransformedLesson, useLongName = false) {
	if (useLongName && lesson.subject?.longName) return lesson.subject.longName
	if (lesson.subject?.name) return lesson.subject.name
	if (lesson.info && lesson.info.length > 0) return lesson.info
	if (lesson.text && lesson.text.length > 0) return lesson.text
	if (lesson.teachers.length > 0) return lesson.teachers[0].name
	return '?'
}
