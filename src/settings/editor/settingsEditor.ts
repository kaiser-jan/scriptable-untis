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
} from '@/types/settings'
import { addSettingsCategoryRow } from './settingsCategory'
import { addSettingsMapRow } from './settingsMap'
import { addSettingsValueRow } from './settingsValueRow'

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
	saveConfig: () => void
) {
	const { settings, defaultSettings, blueprint } = options

	log(`Config Editor: Building settings editor for category "${blueprint.title}".`)

	tableMenu.reset()
	tableMenu.addTitleRow(blueprint.title)
	tableMenu.addDescriptionRow(blueprint.description)
	tableMenu.addSpacerRow()

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

	if ('actions' in blueprint && blueprint.actions) {
		for (const action of Object.keys(blueprint.actions)) {
			const actionBlueprint = blueprint.actions[action]
			tableMenu.addButtonRow(actionBlueprint.title, actionBlueprint.description, actionBlueprint.action)
		}
	}

	tableMenu.show()
}
