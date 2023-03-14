export const LOCALE = Device.locale().replace('_', '-')
export const PREVIEW_WIDGET_SIZE: typeof config.widgetFamily = 'small'
export const MAX_TIME_STRING = '10:00'
export const MAX_SUBJECT_NAME_LENGTH = 6
export const MAX_LONG_SUBJECT_NAME_LENGTH = 12
export const NO_VALUE_PLACEHOLDERS = ['---']
export const NOTIFIABLE_TOPICS = ['lessons', 'exams', 'grades', 'absences']
// the layout is a list of views separated by commas, the columns are separated by pipes "|"
export const defaultLayout = 'lessons,exams'
