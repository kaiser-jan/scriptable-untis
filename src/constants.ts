// runtime constants
export const SCRIPT_START_DATETIME = new Date()

// compile-time constants
export const CURRENT_DATETIME = new Date() // '2022-09-15T14:00' or '2022-09-19T12:30'
export const LOCALE = Device.locale().replace('_', '-')
export const PREVIEW_WIDGET_SIZE: typeof config.widgetFamily = 'small'
export const MAX_TIME_STRING = '10:00'
export const MAX_SUBJECT_NAME_LENGTH = 6
export const MAX_LONG_SUBJECT_NAME_LENGTH = 12
export const NO_VALUE_PLACEHOLDERS = ['---']
export const NOTIFIABLE_TOPICS = ['lessons', 'exams', 'grades', 'absences']
// the layout is a list of views separated by commas, the columns are separated by pipes "|"
export const defaultLayout = 'lessons,exams'

export const CONFIG_FILE_NAME = 'untis-config.json'
export const CUSTOM_CONFIG_KEYS = ['subjects']
