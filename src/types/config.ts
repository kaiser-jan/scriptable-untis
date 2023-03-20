import { Config } from '@/preferences/config'

/**
 * A configuration for a single subject.
 * @property color The color of the subject as one of the Colors or a hex value.
 * @property nameOverride A custom subject name, which will be displayed in the timetable.
 * @property longNameOverride A custom long name for the subject, which will be displayed in the timetable if there is enough space.
 * @property ignoreInfo An array of strings which will be ignored in the info field of the lesson.
 * @property teachers A map of teachers to their own subject configuration.
 */
export interface SubjectConfig {
	color?: string
	nameOverride?: string
	longNameOverride?: string
	ignoreInfos?: string[]
	teachers?: TeacherSpecificSubjectConfig[]
}

export type TeacherSpecificSubjectConfig = Omit<SubjectConfig, 'teachers'> & { teacher: string }

export type SubjectConfigs = Record<string, SubjectConfig>

export type Description = {
	_title: string
	_description: string
}

/**
 * A title and description for each config option (nested).
 */
export type ObjectDescription<T> = {
	[key in keyof T]: T[key] extends object ? ObjectDescription<T[key]> & Description : Description
}

export type ReplaceKeyType<T, K extends keyof T, R> = Omit<T, K> & Record<K, R>

//#region Config Editor Types

// TODO: rework the types

export type ConfigValue = string | number | boolean

export type GeneralizedConfigEntry = GeneralizedConfig | ConfigValue | SubjectConfigs

export type GeneralizedConfig = {
	[key: string]: GeneralizedConfigEntry
}

export type GeneralizedConfigDescription = {
	_title: string
	_description: string
	[key: string]: Description | (GeneralizedConfigDescription & Description) | string
}

export interface ConfigEditorOptions {
	configPart: GeneralizedConfig
	defaultConfig: GeneralizedConfig
	fullConfig: Config
	descriptions: GeneralizedConfigDescription
}

//#endregion
