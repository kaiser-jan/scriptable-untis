import { SettingsCategory, SettingsValueType } from '@/types/settings'
import { defaultSettings } from '../settings'

export const settingsBlueprint: SettingsCategory<typeof defaultSettings> = {
	title: '🛠️ Settings',
	description: 'Configure the widget to your needs.',
	items: {
		subjects: {
			title: '📚 Subjects',
			description: 'Colors, names etc. for the subjects.',
			items: {
				_: {
					title: '📚 Subject',
					description: 'Colors, names etc. for a subject.',
					type: SettingsValueType.CUSTOM,
				},
			},
		},

		config: {
			title: '⚙️ Config',
			description: 'General configuration options (e.g. locale).',

			items: {
				locale: {
					title: '🌐 Locale',
					description: 'Affects date formats.',
					type: SettingsValueType.LOCALE,
				},
				breakMin: {
					title: '🕐️ Minimum break duration',
					description: 'How many minutes a gap needs to be to separate two lessons.',
					type: SettingsValueType.DURATION,
				},
				breakMax: {
					title: '🕑️ Maximum break duration',
					description: 'Up to how many minutes a gap should be considered a break and not a free period.',
					type: SettingsValueType.DURATION,
				},
			},
		},

		cache: {
			title: '🗃️ Cache',
			description: 'How long data should be reused instead of re-downloaded.',

			items: {
				user: {
					title: '👤 User',
					description: 'How long login data should be cached.',
					type: SettingsValueType.DURATION,
				},
				lessons: {
					title: '📚 Lessons',
					description: 'How long lessons should be cached. This should be rather frequent.',
					type: SettingsValueType.DURATION,
				},
				exams: {
					title: '📝 Exams',
					description: 'How long exams should be cached.',
					type: SettingsValueType.DURATION,
				},
				grades: {
					title: '🎓 Grades',
					description: 'How long grades should be cached.',
					type: SettingsValueType.DURATION,
				},
				absences: {
					title: '🚫 Absences',
					description: 'How long absences should be cached.',
					type: SettingsValueType.DURATION,
				},
				schoolYears: {
					title: '📅 School Years',
					description: 'How long school years should be cached. This can be quite long.',
					type: SettingsValueType.DURATION,
				},
			},
		},

		refresh: {
			title: '🔄️ Refresh',
			description: 'How often the data should be refreshed.',

			items: {
				normalScope: {
					title: '🕐️ Normal Scope',
					description: 'How long before the next lesson the widget should start updating regularly.',
					type: SettingsValueType.DURATION,
				},
				normalInterval: {
					title: '🕑️ Normal Interval',
					description: 'How often the widget should update.',
					type: SettingsValueType.DURATION,
				},
				lazyInterval: {
					title: '🕒️ Lazy Interval',
					description: 'How often the widget should update when there are no lessons in the normal scope.',
					type: SettingsValueType.DURATION,
				},
			},
		},

		views: {
			title: '🖼️ Views',
			description: 'Configuration for the different views.',

			items: {
				lessons: {
					title: '📚 Lessons',
					description: 'Configuration for the lessons view.',

					items: {
						maxCount: {
							title: '📝 Maximum Count',
							description: 'How many lessons should be shown.',
							type: SettingsValueType.COUNT,
						},
						showCanceled: {
							title: '🚫 Show Canceled',
							description: 'Whether canceled lessons should be shown.',
							type: SettingsValueType.SHOW_HIDE,
						},
						showLongBreaks: {
							title: '🕐️ Show Long Breaks',
							description: 'Whether long breaks should be displayed.',
							type: SettingsValueType.SHOW_HIDE,
						},
						showEndTimes: {
							title: '🕒️ Show End Times',
							description: 'Whether the end times should be displayed. (if there is enough space)',
							type: SettingsValueType.SHOW_HIDE,
						},
						showMultiplier: {
							title: '🔢 Show Multiplier',
							description: 'Whether a multiplier (x2) should be displayed for longer lessons.',
							type: SettingsValueType.SHOW_HIDE,
						},
						skipShortBreaks: {
							title: '🕑️ Skip Short Breaks',
							description:
								'Whether short breaks should be skipped and subtracted from the end time of a lesson.',
							type: SettingsValueType.ON_OFF,
						},
					},
				},

				exams: {
					title: '📝 Exams',
					description: 'Configuration for the exams view.',

					items: {
						maxCount: {
							title: '🔢 Maximum Count',
							description: 'How many exams should be shown.',
							type: SettingsValueType.COUNT,
						},
						scope: {
							title: '📅 Scope',
							description: 'How long in advance the exams should be shown.',
							type: SettingsValueType.DURATION,
						},
					},
				},

				grades: {
					title: '🎓 Grades',
					description: 'Configuration for the grades view.',

					items: {
						maxCount: {
							title: '🔢 Maximum Count',
							description: 'How many grades should be shown.',
							type: SettingsValueType.COUNT,
						},
						scope: {
							title: '📅 Scope (Days)',
							description: 'How many days grades should be shown.',
							type: SettingsValueType.DURATION,
						},
					},
				},

				absences: {
					title: '🚫 Absences',
					description: 'Configuration for the absences view.',

					items: {
						maxCount: {
							title: '🔢 Maximum Count',
							description: 'How many absences should be shown.',
							type: SettingsValueType.COUNT,
						},
					},
				},
			},
		},
		notifications: {
			title: '🔔 Notifications',
			description: 'Which notifications to deliver.',

			items: {
				lessons: {
					title: '📚 Lesson Notifications',
					description: 'Enable lesson notifications? (added/canceled/shifted lessons etc.)',
					type: SettingsValueType.ON_OFF,
				},
				exams: {
					title: '📝 Exam Notifications',
					description: 'Enable exam notifications? (added exams)',
					type: SettingsValueType.ON_OFF,
				},
				grades: {
					title: '🎓 Grade Notifications',
					description: 'Enable grade notifications? (added grades)',
					type: SettingsValueType.ON_OFF,
				},
				absences: {
					title: '🚫 Absence Notifications',
					description: 'Enable absence notifications? (added absences)',
					type: SettingsValueType.ON_OFF,
				},
			},
		},
		appearance: {
			title: '🎨 Appearance',
			description: 'Configuration for the appearance of the widget.',
			items: {
				cornerRadius: {
					title: '🔲️ Corner Radius',
					description: 'The corner radius of the items within the widget.',
					type: SettingsValueType.COUNT,
				},
				fontSize: {
					title: '🔤 Font Size',
					description: 'The font size of texts items within the widget.',
					type: SettingsValueType.COUNT,
				},
				padding: {
					title: '📏 Padding',
					description: 'The around the widget content.',
					type: SettingsValueType.COUNT,
				},
				spacing: {
					title: '📏 Spacing',
					description: 'The space between items within the widget.',
					type: SettingsValueType.COUNT,
				},
				footer: {
					title: '📝 Footer',
					description: 'Whether the footer should be shown.',
					type: SettingsValueType.SHOW_HIDE,
				},
			},
		},
	},
}

// const defaultSettings: DefaultSettings<typeof settingsConfig> = getDefaultSettings(settingsConfig)

// function getDefaultSettings<T extends SettingsConfig>(config: T) {
// 	const defaultSettings: any = {}

// 	for (const key in config) {
// 		const item = config[key]
// 		if ('default' in item) {
// 			defaultSettings[key] = item.default
// 		} else {
// 			defaultSettings[key] = getDefaultSettings<typeof item>(item)
// 		}
// 	}
// 	return defaultSettings
// }

// type DefaultSettings<T extends SettingsConfig> = {
// 	[K in keyof T]: T[K] extends { default: infer U }
// 		? U
// 		: T[K] extends { items: SettingsConfig }
// 		? DefaultSettings<T[K]['items']>
// 		: string
// }
