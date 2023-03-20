import { ConfigEditorOptions, ConfigValue, GeneralizedConfig } from '@/types/config'
import { getModuleFileManager, readConfig, writeConfig } from '@/utils/scriptable/fileSystem'
import { defaultConfig } from '../config'
import { configDescription } from './configDescription'
import { CUSTOM_CONFIG_KEYS } from '@/constants'
import { addCategoryRow as addConfigCategoryRow } from './categoryRow'
import { addValueRow as addConfigValueRow } from './valueRow'

/**
 * Opens the config editor as a UITable.
 * A clickable row is added for each category (and subcategories).
 * Each setting as a row showing its title and current value.
 * Clicking on a row will open a modal to edit the value, depending on its type.
 */
export async function openConfigEditor() {
	const { useICloud, fileManager } = getModuleFileManager()
	const widgetConfig = await readConfig(useICloud)

	createConfigEditorFor(
		{
			configPart: widgetConfig,
			defaultConfig,
			fullConfig: widgetConfig,
			descriptions: configDescription,
		},
		() => writeConfig(useICloud, widgetConfig)
	)
}

/**
 * Creates and presents the UITable for the config editor at the current nested level.
 */
export function createConfigEditorFor(options: ConfigEditorOptions, saveFullConfig: () => void) {
	const table = new UITable()
	table.showSeparators = true

	updateConfigEditor(table, options, saveFullConfig)

	table.present()
}

/**
 * Updates the UITable with the config editor for the current nested level.
 */
export function updateConfigEditor(table: UITable, options: ConfigEditorOptions, saveFullConfig: () => void) {
	table.removeAllRows()

	const { configPart: config, defaultConfig, descriptions } = options

	const headerRow = new UITableRow()
	headerRow.height = 60
	headerRow.isHeader = true
	const titleCell = headerRow.addText(descriptions._title)
	titleCell.titleFont = Font.semiboldSystemFont(28)

	// TODO: add a reset all button
	table.addRow(headerRow)

	// add a row for each category and setting
	for (const key of Object.keys(defaultConfig)) {
		const configPart = config[key]
		const defaultConfigPart = defaultConfig[key]
		const descriptionsPart = descriptions[key]

		// this can't happen, as only _title and _description are strings, and are not used as keys
		if (typeof descriptionsPart === 'string') continue

		// if this is a category, add a row for it
		if (typeof configPart === 'object' || typeof defaultConfigPart === 'object') {
			addConfigCategoryRow(
				table,
				key,
				configPart as GeneralizedConfig,
				defaultConfigPart as GeneralizedConfig,
				options.fullConfig,
				descriptionsPart,
				saveFullConfig
			)
		} else if (CUSTOM_CONFIG_KEYS.includes(key)) {
			// exclude custom config keys from the list of settings (like subjects)
			continue
		} else {
			// add a row for this setting
			addConfigValueRow(table, key, configPart, defaultConfigPart, descriptionsPart, (newValue: ConfigValue) => {
				// modify this value in the config
				config[key] = newValue
				console.log(`Config Editor: Set "${key}" to "${newValue}".`)
				saveFullConfig()
				updateConfigEditor(table, options, saveFullConfig)
			})
		}
	}

	table.reload()
}
