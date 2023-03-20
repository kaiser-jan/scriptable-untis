import { SubjectConfig } from '@/types/config'
import { TransformedLesson, TransformedLessonWeek } from '@/types/transformed'
import { unparsedColors } from './colors'
import { Config } from './config'

/**
 * Applies the custom lesson config to a timetable.
 **/
export function applyLessonConfigs(timetable: TransformedLessonWeek, widgetConfig: Config) {
	// iterate over the days, then the lessons
	for (const key of Object.keys(timetable)) {
		const day = timetable[key]
		for (const lesson of day) {
			// apply the lesson config
			applyCustomLessonConfig(lesson, widgetConfig)
		}
	}
}

/**
 * Applies the custom lesson config to a lesson.
 */
function applyCustomLessonConfig(lesson: TransformedLesson, widgetConfig: Config) {
	lesson.backgroundColor = unparsedColors.background.primary

	// return default values if there is no custom config
	if (!lesson.subject || !widgetConfig.subjects[lesson.subject?.name]) {
		return
	}

	const unparsedSubjectConfig = widgetConfig.subjects[lesson.subject?.name]
	let subjectConfig: SubjectConfig = unparsedSubjectConfig

	// unwrap the option, as there can be teacher specific widgetConfig
	if (unparsedSubjectConfig.teachers) {
		const foundTeacher = unparsedSubjectConfig.teachers.find((teacherConfig) => {
			return lesson.teachers.some((teacher) => teacherConfig.teacher === teacher.name)
		})
		if (foundTeacher) subjectConfig = foundTeacher
	}

	if (!subjectConfig) {
		return
	}

	// apply the custom color
	if (subjectConfig.ignoreInfos?.includes(lesson.info ?? '')) lesson.info = ''
	if (subjectConfig.ignoreInfos?.includes(lesson.note ?? '')) lesson.note = ''
	if (subjectConfig.ignoreInfos?.includes(lesson.text ?? '')) lesson.text = ''
	if (subjectConfig.nameOverride) lesson.subject.name = subjectConfig.nameOverride
	if (subjectConfig.longNameOverride) lesson.subject.longName = subjectConfig.longNameOverride
	if (subjectConfig.color) lesson.backgroundColor = subjectConfig.color
}
