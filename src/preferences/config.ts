import { TransformedLessonWeek, TransformedLesson } from "@/types/transformed"
import { unparsedColors } from "./colors"

interface SingleLessonOption {
	color: string
	longNameOverride?: string
	ignoreInfo?: string[]
	subjectOverride?: string
}

interface TeacherSpecificLessonOption extends SingleLessonOption {
	teacher: string
}

type LessonOptions = {
	[key: string]: SingleLessonOption | TeacherSpecificLessonOption[]
}

export interface Options extends Config {
	useICloud: boolean
	documentsDirectory: string
}

export const defaultConfig = {
	lessonOptions: {
		SubjectShortName: {
			color: 'orange',
			subjectOverride: 'CustomSubjectName',
			longNameOverride: 'SubjectLongName',
			ignoreInfo: ['InfoTagWhichShouldBeIgnored'],
		},
		SubjectShortName2: [
			{
				teacher: 'TeacherForWhichThisShouldBeApplied',
				color: 'blue',
				subjectOverride: 'CustomSubjectName',
				longNameOverride: 'SubjectLongName',
				ignoreInfo: ['InfoTagWhichShouldBeIgnored'],
			},
		],
	} as LessonOptions,

	config: {
		locale: 'de-AT',
		breakMinMinutes: 7,
		breakMaxMinutes: 45,
		refreshing: {
			normalScopeHours: 12,
			normalIntervalMinutes: 60,
			lazyIntervalMinutes: 4 * 60,
		},
		cacheHours: {
			user: 0.25,
			lessons: 0.5,
			exams: 24,
			grades: 8,
			absences: 24,
			schoolYears: 24,
		},
	},

	views: {
		lessons: {
			maxCount: 8,
			showCanceled: true,
			showLongBreaks: true,
			skipShortBreaks: true,
			showEndTimes: true,
		},
		exams: {
			maxCount: 3,
			scopeDays: 7,
		},
		grades: {
			maxCount: 1,
			scopeDays: 7,
		},
		absences: {
			maxCount: 3,
		},
	},

	notifications: {
		enabled: {
			lessons: true,
			exams: true,
			grades: true,
			absences: true,
		},
	},

	appearance: {
		cornerRadius: 4,
		spacing: 6,
		padding: 8,
		fontSize: 14,
	},
	summary: {
		showMultiplier: true,
	},
	footer: {
		show: true,
	},
}

export type Config = typeof defaultConfig

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


/**
 * Applies the custom lesson config to a timetable.
 **/
export function applyLessonConfigs(timetable: TransformedLessonWeek, config: Config) {
	// iterate over the days, then the lessons
	for (const key of Object.keys(timetable)) {
		const day = timetable[key]
		for (const lesson of day) {
			// apply the lesson config
			applyCustomLessonConfig(lesson, config)
		}
	}
}

/**
 * Applies the custom lesson config to a lesson.
 */
function applyCustomLessonConfig(lesson: TransformedLesson, config: Config) {
	lesson.backgroundColor = unparsedColors.background.primary

	// return default values if there is no custom config
	if (!lesson.subject || !config.lessonOptions[lesson.subject?.name]) {
		return
	}

	const customOption = config.lessonOptions[lesson.subject?.name]
	let unwrappedCustomOption: SingleLessonOption | undefined

	// unwrap the option, as there can be teacher specific options
	if (Array.isArray(customOption)) {
		unwrappedCustomOption = customOption.find((option) => {
			return lesson.teachers.some((teacher) => teacher.name === option.teacher)
		})
	} else {
		unwrappedCustomOption = customOption
	}

	if (!unwrappedCustomOption) {
		return
	}

	// apply the custom color
	if (unwrappedCustomOption.ignoreInfo?.includes(lesson.info ?? '')) lesson.info = ''
	if (unwrappedCustomOption.ignoreInfo?.includes(lesson.note ?? '')) lesson.note = ''
	if (unwrappedCustomOption.ignoreInfo?.includes(lesson.text ?? '')) lesson.text = ''
	if (unwrappedCustomOption.subjectOverride) lesson.subject.name = unwrappedCustomOption.subjectOverride
	if (unwrappedCustomOption.longNameOverride) lesson.subject.longName = unwrappedCustomOption.longNameOverride
	if (unwrappedCustomOption.color) lesson.backgroundColor = unwrappedCustomOption.color
}
