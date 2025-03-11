import { Duration, DurationUnit } from './utils/duration'
import { getDeviceLocaleAsIntlLocale } from './utils/scriptable/deviceHelper'

// runtime constants
export const SCRIPT_START_DATETIME = new Date()
export const LOCALE = getDeviceLocaleAsIntlLocale('en-US')

// NOTE: if possible, use the datetime override in the settings instead of changing this constant
export let CURRENT_DATETIME = new Date() // '2022-09-15T14:00' or '2022-09-19T12:30'
export function setCurrentDatetime(datetime: Date) {
	CURRENT_DATETIME = datetime
}

// compile-time constants
export const UPDATE_INTERVAL = new Duration(8, DurationUnit.HOUR)
export const PREVIEW_WIDGET_SIZE: typeof config.widgetFamily = 'small'
export const MAX_TIME_STRING = '10:00'
export const MAX_SUBJECT_NAME_LENGTH = 6
export const MAX_LONG_SUBJECT_NAME_LENGTH = 12
export const NO_VALUE_PLACEHOLDERS = ['---']
export const NOTIFIABLE_TOPICS = ['lessons', 'exams', 'grades', 'absences']
// the layout is a list of views separated by commas, the columns are separated by pipes "|"
export const defaultLayout = 'lessons,exams,grades,absences'
export const CONFIG_FILE_NAME = 'untis-config.json'
export const CUSTOM_CONFIG_KEYS = ['subjects']
export const GITHUB_USER = 'kaiser-jan'
export const GITHUB_REPO = 'scriptable-untis'
export const GITHUB_SCRIPT_NAME = 'UntisWidget.js'
