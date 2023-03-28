import { ConfigEditorOptions, ConfigValue, Description, GeneralizedConfig } from '@/types/config'
import { getModuleFileManager, readConfig, writeConfig } from '@/utils/scriptable/fileSystem'
import { TableMenu } from '@/utils/scriptable/table/tableMenu'
import { defaultConfig } from '../config'
import { configDescription } from './configDescription'
import { openValueEditor } from './valueEditor'
import { TableMenuCell } from '@/utils/scriptable/table/tableMenuCell'

/**
 * Opens the config editor as a UITable.
 * A clickable row is added for each category (and subcategories).
 * Each setting as a row showing its title and current value.
 * Clicking on a row will open a modal to edit the value, depending on its type.
 */
export async function openConfigEditor() {
	const { useICloud, fileManager } = getModuleFileManager()
	const widgetConfig = await readConfig(useICloud)

	const tableMenu = new TableMenu(new UITable())
	buildConfigEditor(
		tableMenu,
		{
			configPart: widgetConfig,
			defaultConfigPart: defaultConfig,
			fullConfig: widgetConfig,
			descriptionsPart: configDescription,
		},
		() => {
			writeConfig(useICloud, widgetConfig)
		}
	)
}

export function buildConfigEditor(tableMenu: TableMenu, options: ConfigEditorOptions, saveConfig: () => void) {
	const { configPart, defaultConfigPart, descriptionsPart } = options

	tableMenu.reset()

	tableMenu.addTitleRow(descriptionsPart._title)

	for (const key of Object.keys(defaultConfigPart)) {
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

		function updateValue(newValue: ConfigValue) {
			// modify this value in the config
			configPart[key] = newValue
			console.log(`Config Editor: Set "${key}" to "${newValue}".`)
			saveConfig()
			buildConfigEditor(tableMenu, options, saveConfig)
		}

		// if this is a category, add a row for it
		if (typeof defaultSubConfigPart === 'object') {
			addConfigCategoryRow(tableMenu, key, optionsPart, saveConfig)
		} else {
			// add a row for this setting
			addConfigValueRow(
				tableMenu,
				configSubPart as ConfigValue,
				defaultSubConfigPart,
				descriptionsSubPart,
				updateValue
			)
		}
	}

	tableMenu.show()
}

function addConfigCategoryRow(tableMenu: TableMenu, key: string, options: ConfigEditorOptions, saveConfig: () => void) {
	const row = tableMenu.addTextRow(options.descriptionsPart._title, options.descriptionsPart._description)

	row.setOnTap(() => {
		// show the subject list editor
		if (key === 'subjects') {
			// TODO: implement
			// showSubjectListEditor(table, options.fullConfig, saveFullConfig, backFunction)
			return
		}

		buildConfigEditor(tableMenu.createSubView(), options, saveConfig)
	})
}

function addConfigValueRow(
	tableMenu: TableMenu,
	value: ConfigValue,
	defaultValue: ConfigValue,
	description: Description,
	updateValue: (newValue: ConfigValue) => void
) {
	const row = tableMenu.addTextRow(description._title, description._description)

	let valueCell: TableMenuCell

	const isDefaultValue = value === defaultValue
	let defaultValueIndicator = isDefaultValue ? '' : defaultValue.toString()

	if (typeof value === 'boolean') {
		const valueIndicator = value ? '✅' : '❌'
		valueCell = row.addText(valueIndicator, defaultValueIndicator, { width: 20 })
		row.setOnTap(() => updateValue(!value))
	} else {
		valueCell = row.addText(value.toString(), defaultValueIndicator, { width: 24 })
		row.setOnTap(async () => {
			const newValue = await openValueEditor(value, defaultValue, description)
			if (!newValue) return
			updateValue(newValue)
		})
	}

	if (value !== defaultValue) {
		const buttonCell = row.addIconButton('↩️', () => updateValue(defaultValue))
		valueCell.width -= buttonCell.width
	}
}
