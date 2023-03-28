import { Settings } from '@/settings/defaultConfig'

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

export type SettingsValue = string | number | boolean

export type GeneralizedSettingsEntry = GeneralizedSettings | SettingsValue | SubjectConfigs

export type GeneralizedSettings = {
	[key: string]: GeneralizedSettingsEntry
}

export type GeneralizedSettingsDescription = {
	_title: string
	_description: string
	[key: string]: Description | (GeneralizedSettingsDescription & Description) | string
}

export interface SettingsEditorParameters {
	configPart: GeneralizedSettings
	defaultConfigPart: GeneralizedSettings
	fullConfig: Settings
	descriptionsPart: GeneralizedSettingsDescription
}

export type BackFunctionType = () => void
export type SaveFullConfigFunction = (backFunction: BackFunctionType) => void

//#endregion
