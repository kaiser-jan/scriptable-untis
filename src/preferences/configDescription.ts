import { ConfigDescription } from './config'

export const configDescription: ConfigDescription = {
	subjects: {
		title: '📚 Subjects',
		description: 'Colors, names etc. for the subjects.',
	},
	config: {
		title: '⚙️ Config',
		description: 'General configuration options like the locale.',

		locale: {
			title: '🌐 Locale',
			description: 'The locale to use for the widget.',
		},
		breakMinMinutes: {
			title: '🕐️ Minimum break duration (minutes)',
			description: 'How many minutes a gap needs to be to separate two lessons.',
		},
		breakMaxMinutes: {
			title: '🕑️ Maximum break duration (minutes)',
			description: 'Up to how many minutes a gap should be considered a break and not a free period.',
		},
	},
	cacheHours: {
		title: '🗃️ Cache',
		description: 'How long the data should be cached. (saved and re-used instead of re-downloaded)',

		user: {
			title: '👤 User',
			description: 'How long the user login data should be cached.',
		},
		lessons: {
			title: '📚 Lessons',
			description: 'How long the lessons should be cached. This should be rather frequent.',
		},
		exams: {
			title: '📝 Exams',
			description: 'How long the exams should be cached.',
		},
		grades: {
			title: '🎓 Grades',
			description: 'How long the grades should be cached.',
		},
		absences: {
			title: '🚫 Absences',
			description: 'How long the absences should be cached.',
		},
		schoolYears: {
			title: '📅 School Years',
			description: 'How long the school years should be cached This can be quite long.',
		},
	},
	refresh: {
		title: '🔄️ Refresh',
		description: 'How often the data should be refreshed.',

		normalScopeHours: {
			title: '🕐️ Normal Scope (Hours)',
			description: 'How many hours before the next lesson the widget should start updating regularly.',
		},
		normalIntervalMinutes: {
			title: '🕑️ Normal Interval (Minutes)',
			description: 'How often the widget should update regularly.',
		},
		lazyIntervalMinutes: {
			title: '🕒️ Lazy Interval (Minutes)',
			description: 'How often the widget should update when there are no lessons in the normal scope.',
		},
	},
	views: {
		title: '🖼️ Views',
		description: 'Configuration for the different views.',

		lessons: {
			title: '📚 Lessons',
			description: 'Configuration for the lessons view.',

			maxCount: {
				title: '📝 Maximum Count',
				description: 'How many lessons should be shown.',
			},
			showCanceled: {
				title: '🚫 Show Canceled',
				description: 'Whether canceled lessons should be shown.',
			},
			showLongBreaks: {
				title: '🕐️ Show Long Breaks',
				description: 'Whether long breaks should be displayed.',
			},
			showEndTimes: {
				title: '🕒️ Show End Times',
				description: 'Whether the end times should be displayed. (if there is enough space)',
			},
			showMultiplier: {
				title: '🔢 Show Multiplier',
				description: 'Whether a multiplier (x2) should be displayed for longer lessons.',
			},
			skipShortBreaks: {
				title: '🕑️ Skip Short Breaks',
				description: 'Whether short breaks should be skipped and subtracted from the end time of a lesson.',
			},
		},

		exams: {
			title: '📝 Exams',
			description: 'Configuration for the exams view.',

			maxCount: {
				title: '🔢 Maximum Count',
				description: 'How many exams should be shown.',
			},
			scopeDays: {
				title: '📅 Scope (Days)',
				description: 'How many days in the future the exams should be shown.',
			},
		},

		grades: {
			title: '🎓 Grades',
			description: 'Configuration for the grades view.',

			maxCount: {
				title: '🔢 Maximum Count',
				description: 'How many grades should be shown.',
			},
			scopeDays: {
				title: '📅 Scope (Days)',
				description: 'How many days in the past the grades should be shown.',
			},
		},

		absences: {
			title: '🚫 Absences',
			description: 'Configuration for the absences view.',

			maxCount: {
				title: '🔢 Maximum Count',
				description: 'How many absences should be shown.',
			},
		},
	},
	notifications: {
		title: '🔔 Notifications',
		description: 'Which notifications to deliver.',

		enabled: {
			title: '🔔 Notifications Enabled',
			description: 'Which notifications should be enabled.',
			lessons: {
				title: '📚 Lesson Notifications',
				description: 'Whether lesson notifications should be enabled. (added/canceled/shifted lessons etc.)',
			},
			exams: {
				title: '📝 Exam Notifications',
				description: 'Whether exam notifications should be enabled.',
			},
			grades: {
				title: '🎓 Grade Notifications',
				description: 'Whether grade notifications should be enabled. (added grades)',
			},
			absences: {
				title: '🚫 Absence Notifications',
				description: 'Whether absence notifications should be enabled. (added absences)',
			},
		},
	},
	appearance: {
		title: '🎨 Appearance',
		description: 'Configuration for the appearance of the widget.',
		cornerRadius: {
			title: '🔲️ Corner Radius',
			description: 'The corner radius of the items within the widget.',
		},
		fontSize: {
			title: '🔤 Font Size',
			description: 'The font size of the items within the widget.',
		},
		padding: {
			title: '📏 Padding',
			description: 'The padding (space inside) of the items within the widget.',
		},
		spacing: {
			title: '📏 Spacing',
			description: 'The spacing (space between) of the items within the widget.',
		},
	},
	footer: {
		title: '📝 Footer',
		description: 'Configuration for the footer.',
		show: {
			title: '🎚️ Footer Enabled',
			description: 'Whether the footer should be enabled.',
		},
	},
}
