import { getModuleFileManager, readConfig, writeConfig } from '@/utils/scriptable/fileSystem'
import { TableMenu } from '@/utils/scriptable/table/tableMenu'
import { Settings, defaultSettings } from '../settings'
import { settingsBlueprint } from './settingsBlueprint'
import {
	GeneralizedSettings,
	SettingsCategory,
	SettingsStructureBase,
	SettingsMap,
	SettingsValue,
	PrimitiveSettingsValue,
	isSettingsValue,
	isPrimitiveSettingsValue,
	isSettingsMap,
	SettingsEditorParameters,
	GeneralizedSettingsCategory,
	SettingsValueType,
	isExternalSettingsCategory,
} from '@/types/settings'
import { addSettingsCategoryRow } from './settingsCategory'
import { addSettingsMapRow } from './settingsMap'
import { addSettingsValueRow } from './settingsValueRow'
import { KeychainManager } from '@/utils/scriptable/keychainManager'
import { handleError } from '@/utils/errors'

/**
 * Opens the config editor as a UITable.
 * A clickable row is added for each category (and subcategories).
 * Each setting as a row showing its title and current value.
 * Clicking on a row will open a modal to edit the value, depending on its type.
 */
export async function openSettings() {
	const { useICloud, fileManager } = getModuleFileManager()
	const widgetConfig = await readConfig(useICloud)

	const tableMenu = new TableMenu(new UITable())
	// build the settings editor for the root "category"
	buildSettingsEditorFor(
		tableMenu,
		{
			settings: widgetConfig,
			defaultSettings: defaultSettings,
			fullSettings: widgetConfig,
			blueprint: settingsBlueprint,
		},
		() => {
			writeConfig(useICloud, widgetConfig)
		}
	)
}

/**
 * Builds the settings editor for the given category or map.
 * This will add a row for each value/category/map in the category or map.
 */
export function buildSettingsEditorFor(
	tableMenu: TableMenu,
	options: {
		settings: GeneralizedSettings
		defaultSettings: GeneralizedSettings
		blueprint: SettingsCategory<SettingsStructureBase> | SettingsMap<SettingsStructureBase>
		fullSettings: Settings
	},
	saveConfig?: () => void
) {
	const { blueprint } = options

	log(`Config Editor: Building settings editor for category "${blueprint.title}".`)

	tableMenu.reset()
	tableMenu.addTitleRow(blueprint.title)
	tableMenu.addDescriptionRow(blueprint.description)
	tableMenu.addSpacerRow()

	if ('items' in blueprint && blueprint.items) {
		buildItems(tableMenu, options, saveConfig)
	}

	if ('externalItems' in blueprint && blueprint.externalItems) {
		buildExternalItems(blueprint, tableMenu, options)
	}

	if ('actions' in blueprint && blueprint.actions) {
		buildActions(tableMenu, blueprint, () => {
			buildSettingsEditorFor(tableMenu, options, saveConfig)
		})
	}

	tableMenu.show()
}
function buildItems(
	tableMenu: TableMenu,
	options: {
		settings: GeneralizedSettings
		defaultSettings: GeneralizedSettings
		blueprint: SettingsCategory<SettingsStructureBase> | SettingsMap<SettingsStructureBase>
		fullSettings: Settings
	},
	saveConfig: () => void
) {
	const { settings, defaultSettings, blueprint } = options

	for (const key of Object.keys(blueprint.items)) {
		const settingsPart = settings[key as keyof typeof settings]
		const defaultSettingsPart = defaultSettings[key as keyof typeof defaultSettings]
		// TODO(types): typescript doesn't recognize the union type in the conditional type in the SettingsList types
		const blueprintPart = blueprint.items[key] as SettingsValue | SettingsCategory<SettingsStructureBase>

		function updateValue(newValue: PrimitiveSettingsValue) {
			// modify this value in the config
			settings[key] = newValue
			console.log(`Config Editor: Set "${key}" to "${newValue}".`)
			saveConfig()
			buildSettingsEditorFor(tableMenu, options, saveConfig)
		}

		// if this is a value, add a row for it
		if (isSettingsValue(blueprintPart)) {
			if (!isPrimitiveSettingsValue(settingsPart)) throw new Error(`Settings part "${key}" is not a value.`)
			if (!isPrimitiveSettingsValue(defaultSettingsPart))
				throw new Error(`Default settings part "${key}" is not a value.`)

			addSettingsValueRow(tableMenu, settingsPart, defaultSettingsPart, blueprintPart, updateValue)
			continue
		}

		if (isSettingsMap(blueprintPart)) {
			addSettingsMapRow(
				tableMenu,
				{
					settings: (settingsPart as GeneralizedSettings) ?? {},
					defaultSettings: defaultSettingsPart as GeneralizedSettings,
					blueprint: blueprintPart,
					fullSettings: options.fullSettings,
				},
				saveConfig
			)
			continue
		}

		// otherwise, add a row for the category
		if (isPrimitiveSettingsValue(settingsPart)) throw new Error(`Settings part "${key}" is not a category.`)
		if (isPrimitiveSettingsValue(defaultSettingsPart))
			throw new Error(`Default settings part "${key}" is not a category.`)

		const optionsPart: SettingsEditorParameters<GeneralizedSettingsCategory> = {
			settings: settingsPart,
			defaultSettings: defaultSettingsPart,
			blueprint: blueprintPart,
			fullSettings: options.fullSettings,
		}

		addSettingsCategoryRow(tableMenu, optionsPart, saveConfig)
	}
}

function buildActions(
	tableMenu: TableMenu,
	blueprint: SettingsCategory<SettingsStructureBase>,
	updateView: () => void
) {
	for (const action of Object.keys(blueprint.actions)) {
		const actionBlueprint = blueprint.actions[action]
		tableMenu.addButtonRow(actionBlueprint.title, actionBlueprint.description, async () => {
			// force handling the error, as this will be ignored because it is not called in the program but by a callback
			try {
				await actionBlueprint.action({ updateView })
			} catch (error) {
				console.warn('An error occurred while executing the selected action.')
				handleError(error, false)
			}
		})
	}
}

function buildExternalItems(
	blueprint: SettingsCategory<SettingsStructureBase>,
	tableMenu: TableMenu,
	options: {
		settings: GeneralizedSettings
		defaultSettings: GeneralizedSettings
		blueprint: SettingsCategory<SettingsStructureBase> | SettingsMap<SettingsStructureBase>
		fullSettings: Settings
	}
) {
	for (const keychainItem of Object.keys(blueprint.externalItems)) {
		const keychainItemBlueprint = blueprint.externalItems[keychainItem]

		if (isExternalSettingsCategory(keychainItemBlueprint)) {
			addSettingsCategoryRow(tableMenu, {
				blueprint: keychainItemBlueprint,
				settings: {},
				defaultSettings: {},
				fullSettings: options.fullSettings,
			})
			continue
		}

		const filledBlueprint = {
			...keychainItemBlueprint,
			type: SettingsValueType.STRING,
		} as SettingsValue

		log(`Config Editor: Adding keychain item "${keychainItemBlueprint.itemKey}".`)

		let value = KeychainManager.get(keychainItemBlueprint.itemKey) ?? keychainItemBlueprint.default ?? ''
		log(`Config Editor: Value is "${value}" for key ${keychainItemBlueprint.itemKey}.`)

		// handle secure values
		if (keychainItemBlueprint.isSecure) {
			// tell the ui to hide the value
			filledBlueprint.type = SettingsValueType.SECURE_STRING
			// replace the value with a bunch of dots
			value = '•'.repeat(value.length)
		}

		addSettingsValueRow(
			tableMenu,
			value,
			keychainItemBlueprint.default,
			filledBlueprint,
			(newValue: string | undefined) => {
				// store the new value in the keychain
				KeychainManager.set(keychainItemBlueprint.itemKey, newValue ?? '')
				// update the table view
				buildSettingsEditorFor(tableMenu, options)
			}
		)
	}
}
