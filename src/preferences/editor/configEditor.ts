import {
	BackFunctionType,
	ConfigEditorOptions,
	ConfigValue,
	GeneralizedConfig,
	SaveFullConfigFunction,
} from '@/types/config'
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
			defaultConfigPart: defaultConfig,
			fullConfig: widgetConfig,
			descriptionsPart: configDescription,
		},
		() => writeConfig(useICloud, widgetConfig)
	)
}

/**
 * Creates and presents the UITable for the config editor at the current nested level.
 */
export function createConfigEditorFor(options: ConfigEditorOptions, saveFullConfig: SaveFullConfigFunction) {
	const table = new UITable()
	table.showSeparators = true

	// could this lead to unused memory?!
	updateConfigEditor(table, options, saveFullConfig)

	table.present()
}

/**
 * Updates the UITable with the config editor for the current nested level.
 * @param table The UITable to update with the given options.
 * @param saveFullConfig a function that saves the config to the file system.
 * @param backFunction a function to return back to the previous level.
 */
export function updateConfigEditor(
	table: UITable,
	options: ConfigEditorOptions,
	saveFullConfig: SaveFullConfigFunction,
	backFunction?: BackFunctionType
) {
	table.removeAllRows()

	const { configPart, defaultConfigPart, descriptionsPart } = options

	const headerRow = new UITableRow()
	headerRow.height = 60
	headerRow.isHeader = true

	let remainingHeaderWidth = 100

	// add a back button if this is not the top level
	if (backFunction) {
		const backButton = headerRow.addButton('⬅️')
		backButton.onTap = backFunction
		backButton.widthWeight = 15
		remainingHeaderWidth -= backButton.widthWeight
	}

	const titleCell = headerRow.addText(descriptionsPart._title)
	titleCell.titleFont = Font.semiboldSystemFont(28)
	titleCell.widthWeight = remainingHeaderWidth

	// TODO: add a reset all button
	table.addRow(headerRow)

	// add a row for each category and setting
	for (const key of Object.keys(defaultConfigPart)) {
		// exclude custom config keys from the list of settings (like subjects)
		if (CUSTOM_CONFIG_KEYS.includes(key)) {
			continue
		}

		const configSubPart = configPart[key]
		const defaultSubConfigPart = defaultConfigPart[key]
		const descriptionsSubPart = descriptionsPart[key]

		// this can't happen, as only _title and _description are strings, and are not used as keys
		if (typeof descriptionsSubPart === 'string') continue

		const optionsPart = {
			configPart: configSubPart as GeneralizedConfig,
			defaultConfigPart: defaultSubConfigPart as GeneralizedConfig,
			fullConfig: options.fullConfig,
			descriptionsPart: descriptionsSubPart,
		}

		// if this is a category, add a row for it
		if (typeof configSubPart === 'object' || typeof defaultSubConfigPart === 'object') {
			addConfigCategoryRow(table, key, optionsPart, saveFullConfig, () =>
				updateConfigEditor(table, options, saveFullConfig, backFunction)
			)
		} else {
			// add a row for this setting
			addConfigValueRow(
				table,
				configSubPart,
				defaultSubConfigPart,
				descriptionsSubPart,
				// update method
				(newValue: ConfigValue) => {
					// modify this value in the config
					configPart[key] = newValue
					console.log(`Config Editor: Set "${key}" to "${newValue}".`)
					saveFullConfig(backFunction)
					updateConfigEditor(table, options, saveFullConfig, backFunction)
				}
			)
		}
	}

	table.reload()
}
