import { clearCache } from '@/api/cache'
import { SettingsCategory, SettingsValueType, SubjectConfig } from '@/types/settings'
import { showInfoPopup } from '@/utils/scriptable/input'
import { checkForUpdates } from '@/utils/updater'
import { defaultSettings } from '../settings'
import { fillLoginDataInKeychain } from '@/setup'

const subjectBlueprint = {
	color: {
		title: '🎨 Color',
		description: 'The color of the subject.',
		type: SettingsValueType.COLOR,
	},
	nameOverride: {
		title: '📝 Short Name',
		description: 'The short name of the subject.',
		type: SettingsValueType.STRING,
	},
	longNameOverride: {
		title: '📝 Long Name',
		description: 'The long name of the subject.',
		type: SettingsValueType.STRING,
	},
	ignoreInfos: {
		title: '🚫 Ignore Infos',
		description: 'Ignore unnecessary infos.',
		type: SettingsValueType.STRING_ARRAY,
	},
	show: {
		title: '👁️ Show',
		description: 'Whether the subject should be shown.',
		type: SettingsValueType.SHOW_HIDE,
	},
}

function subjectNameFormatter(key: string, item: SubjectConfig) {
	let name = key
	if (item.nameOverride) name += ` (${item.nameOverride})`
	return name
}

export const settingsBlueprint: SettingsCategory<typeof defaultSettings> = {
	title: '🛠️ Settings',
	description: 'Configure the widget to your needs.',

	actions: {
		updateScript: {
			title: '🔄 Update Script',
			description: 'Installs the latest version of the script.',
			action: () => checkForUpdates(true),
		},
		openDocumentation: {
			title: '📖 Open Documentation',
			description: 'Opens the documentation in Safari.',
			action: () => {
				console.log('📖 Opening documentation in Safari.')
				Safari.openInApp('https://github.com/JFK-05/scriptable-untis#readme')
			},
		},
	},

	externalItems: {
		login: {
			title: '🔑 Login',
			description: 'The data needed to login to Untis.',

			actions: {
				setupWizard: {
					title: '🧙‍♂️ Setup Wizard',
					description: 'Walks you through entering your credentials.',
					action: async (parameters) => {
						console.log('🧙‍♂️ Starting setup wizard.')
						await fillLoginDataInKeychain({}, true)
						parameters.updateView()
					},
				},
			},

			externalItems: {
				server: {
					title: '🌐 Server',
					description: 'The subdomain of the Untis server.',
					itemKey: 'server',
				},
				school: {
					title: '🏫 School',
					description: 'The name of the school used in WebUntis.',
					itemKey: 'school',
				},
				username: {
					title: '👤 Username',
					description: 'The username used to login to WebUntis.',
					itemKey: 'username',
				},
				password: {
					title: '🔑 Password',
					description: 'The password used to login to WebUntis.',
					itemKey: 'password',
					isSecure: true,
				},
			},
		},
	},

	items: {
		subjects: {
			title: '📚 Subjects',
			description: 'Custom colors, names etc. for subjects.',
			type: SettingsValueType.MAP,
			addItemTitle: '📚 Add Subject',
			addItemDescription: 'Enter the short name of the subject displayed in Untis.',
			addItemPlaceholder: 'subject short name',
			nameFormatter: subjectNameFormatter,
			items: {
				...subjectBlueprint,
				teachers: {
					title: '👨‍🏫 Teachers',
					description: 'Custom configuration when the subject is taught by a certain teacher.',
					type: SettingsValueType.MAP,
					addItemTitle: '👨‍🏫 Add Teacher',
					addItemDescription: 'Enter the short name of the teacher displayed in Untis.',
					addItemPlaceholder: 'teacher short name',
					nameFormatter: subjectNameFormatter,
					items: subjectBlueprint,
				},
			},
		},

		config: {
			title: '⚙️ General',
			description: 'General configuration options.',

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
			description: 'How long data should be reused.',

			actions: {
				clear: {
					title: '🗑️ Clear Cache',
					description: 'Clears all cached data.',
					action: () => {
						clearCache()
						showInfoPopup('🗑️ The cache has been cleared.')
					},
				},
			},

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
			description: 'How often data should be refreshed.',

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
					title: '💤 Lazy Interval',
					description: 'How often the widget should update when there are no lessons in the normal scope.',
					type: SettingsValueType.DURATION,
				},
			},
		},

		views: {
			title: '🖼️ Views',
			description: 'Change how information is displayed.',

			items: {
				lessons: {
					title: '📚 Lessons',
					description: 'Choose how you want to see your lessons.',

					items: {
						maxCount: {
							title: '🔢 Maximum Count',
							description: 'How many lessons should be shown.',
							type: SettingsValueType.COUNT,
						},
						showCanceled: {
							title: '🚫 Show Canceled',
							description: 'Whether canceled lessons should be shown.',
							type: SettingsValueType.SHOW_HIDE,
						},
						showLongBreaks: {
							title: '🍽️ Show Long Breaks',
							description: 'Whether long breaks should be displayed.',
							type: SettingsValueType.SHOW_HIDE,
						},
						showEndTimes: {
							title: '🎊 Show End Times',
							description: 'Whether the end times should be displayed. (if there is enough space)',
							type: SettingsValueType.SHOW_HIDE,
						},
						showMultiplier: {
							title: '🔢 Show Multiplier',
							description: 'Whether a multiplier (x2) should be displayed for longer lessons.',
							type: SettingsValueType.SHOW_HIDE,
						},
						skipShortBreaks: {
							title: '⏲️ Skip Short Breaks',
							description:
								'Whether short breaks should be skipped and subtracted from the end time of a lesson.',
							type: SettingsValueType.ON_OFF,
						},
					},
				},

				exams: {
					title: '📝 Exams',
					description: 'Edit which exams to display.',

					items: {
						maxCount: {
							title: '🔢 Maximum Count',
							description: 'Up to how many exams should be shown.',
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
					description: 'Edit which grades to display.',

					items: {
						maxCount: {
							title: '🔢 Maximum Count',
							description: 'Up to how many grades should be shown.',
							type: SettingsValueType.COUNT,
						},
						scope: {
							title: '📅 Scope',
							description: 'For how long new should be shown.',
							type: SettingsValueType.DURATION,
						},
					},
				},

				absences: {
					title: '🚫 Absences',
					description: 'Edit which absences to display.',

					items: {
						maxCount: {
							title: '🔢 Maximum Count',
							description: 'Up to how many absences should be shown.',
							type: SettingsValueType.COUNT,
						},
					},
				},
			},
		},
		notifications: {
			title: '🔔 Notifications',
			description: 'Choose which notifications to deliver.',

			items: {
				lessons: {
					title: '📚 Lesson Notifications',
					description: 'added/canceled/shifted lessons etc.',
					type: SettingsValueType.ON_OFF,
				},
				exams: {
					title: '📝 Exam Notifications',
					description: 'added exams',
					type: SettingsValueType.ON_OFF,
				},
				grades: {
					title: '🎓 Grade Notifications',
					description: 'added grades',
					type: SettingsValueType.ON_OFF,
				},
				absences: {
					title: '🚫 Absence Notifications',
					description: 'added absences',
					type: SettingsValueType.ON_OFF,
				},
			},
		},
		appearance: {
			title: '🎨 Appearance',
			description: 'Style the widget to your liking.',
			items: {
				cornerRadius: {
					title: '⭕ Corner Radius',
					description: 'The corner radius of the items within the widget.',
					type: SettingsValueType.COUNT,
				},
				fontSize: {
					title: '🔤 Font Size',
					description: 'The font size of texts items within the widget.',
					type: SettingsValueType.COUNT,
				},
				padding: {
					title: '⏹️ Padding',
					description: 'The space around the widget content.',
					type: SettingsValueType.COUNT,
				},
				spacing: {
					title: '↕️ Spacing',
					description: 'The space between items within the widget.',
					type: SettingsValueType.COUNT,
				},
				footer: {
					title: '📝 Footer',
					description: 'Whether the footer should be shown.',
					type: SettingsValueType.SHOW_HIDE,
				},
				backgroundColor: {
					title: '🎨 Background Color',
					description: 'The background color of the widget.',
					type: SettingsValueType.COLOR,
				},
			},
		},
	},
}
