import { SubjectConfig } from '@/types/settings'
import { TransformedLesson, TransformedLessonWeek } from '@/types/transformed'
import { unparsedColors } from './colors'
import { Settings } from './settings'

/**
 * Applies the custom lesson config to a lesson.
 */
export function applySubjectConfig(lesson: TransformedLesson, subjectConfig: SubjectConfig) {
	lesson.backgroundColor = unparsedColors.background.primary

	if (!subjectConfig) return

	// apply the custom color
	if (subjectConfig.ignoreInfos?.includes(lesson.info ?? '')) lesson.info = ''
	if (subjectConfig.ignoreInfos?.includes(lesson.note ?? '')) lesson.note = ''
	if (subjectConfig.ignoreInfos?.includes(lesson.text ?? '')) lesson.text = ''
	if (subjectConfig.nameOverride) lesson.subject.name = subjectConfig.nameOverride
	if (subjectConfig.longNameOverride) lesson.subject.longName = subjectConfig.longNameOverride
	if (subjectConfig.color) lesson.backgroundColor = subjectConfig.color
}

export function getLessonConfigFor(lesson: TransformedLesson, widgetConfig: Settings) {
	// return default values if there is no custom config
	if (!lesson.subject || !widgetConfig.subjects[lesson.subject?.name]) {
		return undefined
	}

	const unparsedSubjectConfig = widgetConfig.subjects[lesson.subject?.name]
	let subjectConfig: SubjectConfig = unparsedSubjectConfig

	// unwrap the option, as there can be teacher specific widgetConfig
	if (unparsedSubjectConfig.teachers) {
		// TODO(compatibility): what if there are multiple teachers?
		let foundTeacher: SubjectConfig | undefined = undefined
		for (const teacher of lesson.teachers) {
			if (!unparsedSubjectConfig.teachers[teacher.name]) continue
			// if multiple teachers match, the default config will be used
			if (foundTeacher) {
				foundTeacher = undefined
				break
			}
			// otherwise, the teacher specific config will be used
			foundTeacher = unparsedSubjectConfig.teachers[teacher.name]
		}
		if (foundTeacher) subjectConfig = foundTeacher
	}

	return subjectConfig
}
