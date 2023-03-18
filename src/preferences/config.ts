import { SubjectConfigs } from "@/types/config"

// consider splitting the lesson widgetConfig to a separate "class-config"
export const defaultConfig = {
	subjects: {
		'SubjectShortName': {
			color: 'orange',
			nameOverride: 'CustomSubjectName',
			longNameOverride: 'SubjectLongName',
			ignoreInfos: ['InfoTagWhichShouldBeIgnored'],
		},
		'SubjectShortName2': [
			{
				teacher: 'TeacherForWhichThisShouldBeApplied',
				color: 'blue',
				nameOverride: 'CustomSubjectName',
				longNameOverride: 'SubjectLongName',
				ignoreInfos: ['InfoTagWhichShouldBeIgnored'],
			},
		],
	} as SubjectConfigs,

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
			absences: 12,
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
			maxCount: 2,
			scopeDays: 3,
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
		spacing: 4,
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
