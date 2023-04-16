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

export type SettingsValue = SettingDescription & {
	type: SettingsValueType
}

export function isSettingsValue(value: SettingsCategory<any> | SettingsValue): value is SettingsValue {
	return typeof value === 'object' && !Array.isArray(value) && 'type' in value && value.type !== SettingsValueType.MAP
}

export enum SettingsValueType {
	STRING,
	SECURE_STRING,
	STRING_ARRAY,
	COUNT,
	ON_OFF,
	SHOW_HIDE,
	DURATION,
	COLOR,
	LOCALE,
	MAP,
}

export type SettingsStructureBase = {
	[key: string]: SettingsStructureBase | PrimitiveSettingsValue
}

type SettingDescription = {
	title: string
	description: string
}

//#region Category, Map, List

/** The contents of a category in the blueprint. */
export type SettingsCategory<T extends SettingsStructureBase> = SettingDescription & {
	items?: SettingsList<T>
	/** A list of actions in this category which can be executed via buttons. */
	actions?: SettingsActionList
	/**
	 * A list of items which are not contained in the settings object used for the blueprint
	 * This can be used to add categories for e.g. actions or keychain items.
	 */
	externalItems?: ExternalItemList
}

/** A map in the blueprint, which describes the form of the entries. */
export type SettingsMap<T extends SettingsStructureBase> = SettingDescription & {
	items: SettingsList<T>
	type: SettingsValueType.MAP
	addItemTitle?: string
	addItemDescription?: string
	addItemPlaceholder?: string
	nameFormatter?: (key: string, item: T) => string
}

export function isSettingsMap(value: SettingsCategory<any> | SettingsValue): value is SettingsMap<any> {
	return typeof value === 'object' && !Array.isArray(value) && 'type' in value && value.type === SettingsValueType.MAP
}

type KeychainItem = SettingDescription & {
	itemKey: string
	default?: string
	isSecure?: boolean
	validate?: (value: string) => boolean
}

/**
 * A list/map of the available items in the category, which are not part of the regular config object.
 * This can be setting values or other categories.
 */
type ExternalItemList = {
	[key: string]: KeychainItem | ExternalSettingsCategory
}

/**
 * A category for items which are not part of the regular config object.
 * Therefore it cannot contain regular items, just external ones and actions.
 */
type ExternalSettingsCategory = SettingDescription & {
	actions?: SettingsActionList
	externalItems?: ExternalItemList
}

export function isExternalSettingsCategory(
	value: ExternalItemList[keyof ExternalItemList]
): value is ExternalSettingsCategory {
	return typeof value === 'object' && !Array.isArray(value) && 'externalItems' in value
}

/** A list/map of the available actions in the category. */
type SettingsActionList = {
	[key: string]: SettingDescription & {
		action: () => unknown
	}
}

/** A list of entries in the settings blueprint (category, map, value, etc.) */
export type SettingsList<T extends SettingsStructureBase> = {
	[K in keyof T]: T[K] extends SettingsStructureBase
		? T[K] extends { _: SettingsStructureBase }
			? SettingsMap<T[K]['_']>
			: SettingsCategory<T[K]>
		: SettingsValue
}

//#endregion

// #region Generalized

export type PrimitiveSettingsValue = string | number | boolean | string[]

export type GeneralizedSettingsEntry = GeneralizedSettings | PrimitiveSettingsValue

export function isPrimitiveSettingsValue(value: GeneralizedSettingsEntry): value is PrimitiveSettingsValue {
	return typeof value !== 'object' || Array.isArray(value)
}

export type GeneralizedSettings = {
	[key: string]: GeneralizedSettingsEntry
}

export type GeneralizedSettingsCategory = SettingsCategory<SettingsStructureBase>
export type GeneralizedSettingsMap = SettingsMap<SettingsStructureBase>

export interface SettingsEditorParameters<BlueprintT extends GeneralizedSettingsCategory | GeneralizedSettingsMap> {
	settings: GeneralizedSettings
	defaultSettings: GeneralizedSettings
	blueprint: BlueprintT
	fullSettings: Settings
}

//#endregion
//#endregion
