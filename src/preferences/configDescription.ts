import { ConfigDescription } from './config'

export const configDescription: ConfigDescription = {
	_title: '🔧️ Config Editor',
	_description: 'Click a category below to open it.',
	
	subjects: {
		_title: '📚 Subjects',
		_description: 'Colors, names etc. for the subjects.',
	},
	config: {
		_title: '⚙️ Config',
		_description: 'General configuration options (e.g. locale).',

		locale: {
			_title: '🌐 Locale',
			_description: 'Affects date formats.',
		},
		breakMinMinutes: {
			_title: '🕐️ Minimum break duration (minutes)',
			_description: 'How many minutes a gap needs to be to separate two lessons.',
		},
		breakMaxMinutes: {
			_title: '🕑️ Maximum break duration (minutes)',
			_description: 'Up to how many minutes a gap should be considered a break and not a free period.',
		},
	},
	cacheHours: {
		_title: '🗃️ Cache',
		_description: 'How long data should be reused instead of re-downloaded.',

		user: {
			_title: '👤 User',
			_description: 'How long login data should be cached.',
		},
		lessons: {
			_title: '📚 Lessons',
			_description: 'How long lessons should be cached. This should be rather frequent.',
		},
		exams: {
			_title: '📝 Exams',
			_description: 'How long exams should be cached.',
		},
		grades: {
			_title: '🎓 Grades',
			_description: 'How long grades should be cached.',
		},
		absences: {
			_title: '🚫 Absences',
			_description: 'How long absences should be cached.',
		},
		schoolYears: {
			_title: '📅 School Years',
			_description: 'How long school years should be cached. This can be quite long.',
		},
	},
	refresh: {
		_title: '🔄️ Refresh',
		_description: 'How often the data should be refreshed.',

		normalScopeHours: {
			_title: '🕐️ Normal Scope (Hours)',
			_description: 'How many hours before the next lesson the widget should start updating regularly.',
		},
		normalIntervalMinutes: {
			_title: '🕑️ Normal Interval (Minutes)',
			_description: 'How often the widget should update regularly.',
		},
		lazyIntervalMinutes: {
			_title: '🕒️ Lazy Interval (Minutes)',
			_description: 'How often the widget should update when there are no lessons in the normal scope.',
		},
	},
	views: {
		_title: '🖼️ Views',
		_description: 'Configuration for the different views.',

		lessons: {
			_title: '📚 Lessons',
			_description: 'Configuration for the lessons view.',

			maxCount: {
				_title: '📝 Maximum Count',
				_description: 'How many lessons should be shown.',
			},
			showCanceled: {
				_title: '🚫 Show Canceled',
				_description: 'Whether canceled lessons should be shown.',
			},
			showLongBreaks: {
				_title: '🕐️ Show Long Breaks',
				_description: 'Whether long breaks should be displayed.',
			},
			showEndTimes: {
				_title: '🕒️ Show End Times',
				_description: 'Whether the end times should be displayed. (if there is enough space)',
			},
			showMultiplier: {
				_title: '🔢 Show Multiplier',
				_description: 'Whether a multiplier (x2) should be displayed for longer lessons.',
			},
			skipShortBreaks: {
				_title: '🕑️ Skip Short Breaks',
				_description: 'Whether short breaks should be skipped and subtracted from the end time of a lesson.',
			},
		},

		exams: {
			_title: '📝 Exams',
			_description: 'Configuration for the exams view.',

			maxCount: {
				_title: '🔢 Maximum Count',
				_description: 'How many exams should be shown.',
			},
			scopeDays: {
				_title: '📅 Scope (Days)',
				_description: 'How many days in the future the exams should be shown.',
			},
		},

		grades: {
			_title: '🎓 Grades',
			_description: 'Configuration for the grades view.',

			maxCount: {
				_title: '🔢 Maximum Count',
				_description: 'How many grades should be shown.',
			},
			scopeDays: {
				_title: '📅 Scope (Days)',
				_description: 'How many days grades should be shown.',
			},
		},

		absences: {
			_title: '🚫 Absences',
			_description: 'Configuration for the absences view.',

			maxCount: {
				_title: '🔢 Maximum Count',
				_description: 'How many absences should be shown.',
			},
		},
	},
	notifications: {
		_title: '🔔 Notifications',
		_description: 'Which notifications to deliver.',

		enabled: {
			_title: '🔔 Enabled Notifications',
			_description: 'Which notifications should be enabled.',
			lessons: {
				_title: '📚 Lesson Notifications',
				_description: 'Enable lesson notifications? (added/canceled/shifted lessons etc.)',
			},
			exams: {
				_title: '📝 Exam Notifications',
				_description: 'Enable exam notifications? (added exams)',
			},
			grades: {
				_title: '🎓 Grade Notifications',
				_description: 'Enable grade notifications? (added grades)',
			},
			absences: {
				_title: '🚫 Absence Notifications',
				_description: 'Enable absence notifications? (added absences)',
			},
		},
	},
	appearance: {
		_title: '🎨 Appearance',
		_description: 'Configuration for the appearance of the widget.',
		cornerRadius: {
			_title: '🔲️ Corner Radius',
			_description: 'The corner radius of the items within the widget.',
		},
		fontSize: {
			_title: '🔤 Font Size',
			_description: 'The font size of texts items within the widget.',
		},
		padding: {
			_title: '📏 Padding',
			_description: 'The around the widget content.',
		},
		spacing: {
			_title: '📏 Spacing',
			_description: 'The space between items within the widget.',
		},
	},
	footer: {
		_title: '📝 Footer',
		_description: 'Configuration for the footer.',
		show: {
			_title: '🎚️ Footer Enabled',
			_description: 'Whether the footer should be shown.',
		},
	},
}
