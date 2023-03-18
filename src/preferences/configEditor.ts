import { Description, ReplaceKeyType, SubjectConfigs } from '@/types/config'
import { getModuleFileManager, readConfig, writeConfig } from '@/utils/scriptable/fileSystem'
import { configDescription } from './configDescription'
import { defaultConfig } from './config'
import { askForInput, selectOption, showInfoPopup } from '@/utils/scriptable/input'

// TODO: rework the types

const CUSTOM_CONFIG_KEYS = ['subjects']

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
			config: widgetConfig,
			defaultConfig,
			descriptions: configDescription,
		},
		() => {
			// save the config
			writeConfig(useICloud, widgetConfig)
		}
	)
}

type ConfigValue = string | number | boolean

type GeneralizedConfig = {
	[key: string]: GeneralizedConfig | ConfigValue | SubjectConfigs
}

type GeneralizedConfigDescription = {
	_title: string
	_description: string
	[key: string]: Description | (GeneralizedConfigDescription & Description) | string
}

interface ConfigEditorOptions {
	config: GeneralizedConfig
	defaultConfig: GeneralizedConfig
	descriptions: GeneralizedConfigDescription
}

/**
 * Creates the UITable for the config editor at the current nested level.
 */
function createConfigEditorFor(options: ConfigEditorOptions, saveFullConfig: () => void) {
	const table = new UITable()
	table.showSeparators = true

	fillConfigEditorFor(table, options, saveFullConfig)

	table.present()
}

function fillConfigEditorFor(table: UITable, options: ConfigEditorOptions, saveFullConfig: () => void) {
	table.removeAllRows()

	const { config, defaultConfig, descriptions } = options

	const headerRow = new UITableRow()
	headerRow.isHeader = true
	headerRow.addText(descriptions._title)
	// TODO: add a reset all button
	table.addRow(headerRow)

	for (const key of Object.keys(defaultConfig)) {
		const configPart = config[key] as GeneralizedConfig
		const defaultConfigPart = defaultConfig[key] as GeneralizedConfig
		const descriptionsPart = descriptions[key]

		// this can't happen
		if (typeof descriptionsPart === 'string') continue

		if (typeof configPart === 'object') {
			addCategoryRow(table, key, configPart, defaultConfigPart, descriptionsPart, saveFullConfig)
		} else if (CUSTOM_CONFIG_KEYS.includes(key)) {
			continue
		} else {
			addValueRow(
				table,
				key,
				configPart as ConfigValue,
				defaultConfigPart as unknown as ConfigValue,
				descriptionsPart,
				(newValue: ConfigValue) => {
					// modify this value in the config
					config[key] = newValue
					console.log(`Config Editor: Set "${key}" to "${newValue}".`)
					fillConfigEditorFor(table, options, saveFullConfig)
					saveFullConfig()
				}
			)
		}
	}

	table.reload()
}

function addCategoryRow(
	table: UITable,
	key: string,
	config: GeneralizedConfig,
	defaultConfig: GeneralizedConfig,
	description: Description,
	saveFullConfig: () => void
) {
	const row = new UITableRow()
	row.dismissOnSelect = false

	const textCell = row.addText(description._title, description._description)
	textCell.subtitleColor = Color.gray()
	textCell.subtitleFont = Font.systemFont(12)
	textCell.titleFont = Font.mediumSystemFont(16)

	row.onSelect = () => {
		if (key === 'subjects') {
			// TODO
			return
		}
		// WORKAROUND: typescript doesn't recognize the type of description
		createConfigEditorFor(
			{
				config,
				defaultConfig,
				descriptions: description as unknown as GeneralizedConfigDescription,
			},
			saveFullConfig
		)
	}

	table.addRow(row)
}
function addValueRow(
	table: UITable,
	key: string,
	configPart: ConfigValue,
	defaultConfigPart: ConfigValue,
	description: Description,
	changeValue: (newValue: ConfigValue) => void
) {
	const isDefaultValue = configPart === defaultConfigPart

	const row = new UITableRow()
	row.dismissOnSelect = false
	const titleCell = row.addText(description._title, description._description)
	titleCell.widthWeight = 76
	titleCell.titleFont = Font.mediumSystemFont(16)
	titleCell.subtitleFont = Font.systemFont(12)
	titleCell.subtitleColor = Color.gray()

	// show the current value and the default value
	const valueCell = row.addText(configPart.toString(), isDefaultValue ? '' : defaultConfigPart.toString())
	valueCell.widthWeight = 18
	valueCell.titleFont = Font.mediumSystemFont(16)
	valueCell.subtitleFont = Font.systemFont(12)
	valueCell.subtitleColor = Color.gray()

	// if the value is the default value
	if (isDefaultValue) {
		valueCell.titleColor = Color.gray()
		// make the value take up the extra space (from the button)
		valueCell.widthWeight += 6
	} else {
		const buttonCell = row.addButton('↩️')
		buttonCell.widthWeight = 6
		buttonCell.onTap = () => changeValue(defaultConfigPart)
	}

	row.onSelect = async () => {
		// TODO: open modal to edit value
		const newValue = await openValueEditor(configPart, defaultConfigPart, description)
		if (newValue === null) return
		changeValue(newValue)
	}
	table.addRow(row)
}
async function openValueEditor(configPart: ConfigValue, defaultConfigPart: ConfigValue, description: Description) {
	switch (typeof defaultConfigPart) {
		case 'string':
			return openTextValueEditor(configPart as string, defaultConfigPart, description)
		case 'number':
			const value = await openTextValueEditor(configPart.toString(), defaultConfigPart, description)
			// check if the value is a number
			if (isNaN(Number(value))) {
				showInfoPopup('❌ Invalid number', `The value you entered (${value}) is not a number.`)
				return null
			}
			return value
		case 'boolean':
			return openBooleanEditor(Boolean(configPart), defaultConfigPart, description)
		default:
			throw new Error(`Cannot open value editor for unknown type ${typeof configPart}`)
	}
}

async function openTextValueEditor(value: string | number, defaultValue: string | number, description: Description) {
	return await askForInput({
		title: description._title,
		description: description._description,
		placeholder: defaultValue.toString(),
		defaultValue: value.toString(),
	})
}

async function openBooleanEditor(value: boolean, defaultValue: boolean, description: Description) {
	try {
		const response = await selectOption(['true', 'false'], {
			title: description._title,
			description: description._description,
		})
		return response === 'true'
	} catch {
		return undefined
	}
}
