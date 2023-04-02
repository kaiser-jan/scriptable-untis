import { Settings } from '@/settings/settings'

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
	teachers?: Record<string, TeacherSpecificSubjectConfig>
}

export type TeacherSpecificSubjectConfig = Omit<SubjectConfig, 'teachers'>

export type SubjectConfigs = Record<string, SubjectConfig>

//#region Config Editor Types

export type SettingsStructureBase = {
	[key: string]: SettingsStructureBase | PrimitiveSettingsValue
}

type SettingsItemBase = {
	title: string
	description: string
}

export type SettingsCategory<T extends SettingsStructureBase> = SettingsItemBase & {
	items: SettingsList<T>
}

export type SettingsMap<T extends SettingsStructureBase> = SettingsItemBase & {
	items: SettingsList<T>
	type: SettingsValueType.MAP
	nameFormatter?: (key: string, item: T) => string
}

export function isSettingsMap(value: SettingsCategory<any> | SettingsValue): value is SettingsMap<any> {
	return typeof value === 'object' && !Array.isArray(value) && 'type' in value && value.type === SettingsValueType.MAP
}

export type SettingsMapValue = { _: SettingsStructureBase }

export type SettingsList<T extends SettingsStructureBase> = {
	[K in keyof T]: T[K] extends SettingsStructureBase
		? T[K] extends SettingsMapValue
			? SettingsMap<T[K]['_']>
			: SettingsCategory<T[K]>
		: SettingsValue
}

export type SettingsValue = SettingsItemBase & {
	type: SettingsValueType
}

export function isSettingsValue(value: SettingsCategory<any> | SettingsValue): value is SettingsValue {
	return typeof value === 'object' && !Array.isArray(value) && 'type' in value && value.type !== SettingsValueType.MAP
}

export enum SettingsValueType {
	STRING,
	STRING_ARRAY,
	COUNT,
	ON_OFF,
	SHOW_HIDE,
	DURATION,
	COLOR,
	LOCALE,
	MAP,
}

export type PrimitiveSettingsValue = string | number | boolean | string[]

export type GeneralizedSettingsEntry = GeneralizedSettings | PrimitiveSettingsValue

export function isPrimitiveSettingsValue(value: GeneralizedSettingsEntry): value is PrimitiveSettingsValue {
	return typeof value !== 'object' || Array.isArray(value)
}

export type GeneralizedSettings = {
	[key: string]: GeneralizedSettingsEntry
}

export interface SettingsEditorParameters {
	settings: GeneralizedSettings
	defaultSettings: GeneralizedSettings
	blueprint: SettingsCategory<SettingsStructureBase>
	fullSettings: Settings
}

//#endregion
