import { Config } from "@/preferences/config"

/**
 * A configuration for a single subject.
 * @property color The color of the subject as one of the Colors or a hex value.
 * @property longNameOverride A custom long name for the subject, which will be displayed in the timetable if there is enough space.
 * @property ignoreInfo An array of strings which will be ignored in the info field of the lesson.
 * @property subjectOverride A custom subject name, which will be displayed in the timetable.
 */
export interface SubjectConfig {
	color: string
	nameOverride?: string
	longNameOverride?: string
	ignoreInfos?: string[]
}

/**
 * A configuration for a single subject, which is only applied to a specific teacher.
 * This can be used to split combined subjects, like History and Geography.
 * @property teacher The short name of the teacher for which this configuration should be applied.
 */
interface TeacherSpecificSubjectConfig extends SubjectConfig {
	teacher: string
}

export type SubjectConfigs = Record<string, SubjectConfig | TeacherSpecificSubjectConfig[]>

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
	config: GeneralizedConfig
	defaultConfig: GeneralizedConfig
	descriptions: GeneralizedConfigDescription
}

//#endregion
