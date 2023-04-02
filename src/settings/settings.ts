import { Duration, DurationUnit } from '@/utils/duration'

export const defaultSettings = {
	subjects: null,
	config: {
		locale: 'de-AT',
		breakMin: Duration.asSeconds(7, DurationUnit.MINUTE),
		breakMax: Duration.asSeconds(45, DurationUnit.MINUTE),
	},
	cache: {
		user: Duration.asSeconds(15, DurationUnit.MINUTE),
		lessons: Duration.asSeconds(30, DurationUnit.MINUTE),
		exams: Duration.asSeconds(24, DurationUnit.HOUR),
		grades: Duration.asSeconds(8, DurationUnit.HOUR),
		absences: Duration.asSeconds(12, DurationUnit.HOUR),
		schoolYears: Duration.asSeconds(1, DurationUnit.DAY),
	},
	refresh: {
		normalScope: Duration.asSeconds(12, DurationUnit.HOUR),
		normalInterval: Duration.asSeconds(60, DurationUnit.MINUTE),
		lazyInterval: Duration.asSeconds(4, DurationUnit.HOUR),
	},
	views: {
		lessons: {
			maxCount: 8,
			showCanceled: true,
			showLongBreaks: true,
			skipShortBreaks: true,
			showEndTimes: true,
			showMultiplier: true,
		},
		exams: {
			maxCount: 8,
			scope: Duration.asSeconds(7, DurationUnit.DAY),
		},
		grades: {
			maxCount: 2,
			scope: Duration.asSeconds(7, DurationUnit.DAY),
		},
		absences: {
			maxCount: 3,
		},
	},

	notifications: {
		lessons: true,
		exams: true,
		grades: true,
		absences: true,
	},

	appearance: {
		cornerRadius: 4,
		spacing: 4,
		padding: 8,
		fontSize: 14,
		footer: true
	}
}

export type Settings = typeof defaultSettings
