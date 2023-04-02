import {
	GeneralizedSettings,
	PrimitiveSettingsValue,
	SettingsCategory,
	SettingsEditorParameters,
	SettingsMap,
	SettingsStructureBase,
	SettingsValue,
	SettingsValueType,
	isPrimitiveSettingsValue,
	isSettingsMap,
	isSettingsValue,
} from '@/types/settings'
import { Duration } from '@/utils/duration'
import { getModuleFileManager, readConfig, writeConfig } from '@/utils/scriptable/fileSystem'
import { askForSingleInput, showInfoPopup } from '@/utils/scriptable/input'
import { TableMenu } from '@/utils/scriptable/table/tableMenu'
import { TableMenuCell } from '@/utils/scriptable/table/tableMenuCell'
import { TableMenuRowTextOptions } from '@/utils/scriptable/table/tableMenuRow'
import { getColor } from '../colors'
import { Settings, defaultSettings } from '../settings'
import { settingsBlueprint } from './settingsBlueprint'
import { openValueEditor } from './valueEditor'

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
	buildSettingsEditorForCategory(
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

function buildSettingsEditorForCategory(
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

	tableMenu.reset()
	tableMenu.addTitleRow(blueprint.title)

	log(`Config Editor: Building settings editor for category "${blueprint.title}".`)

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
			buildSettingsEditorForCategory(tableMenu, options, saveConfig)
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

		const optionsPart: SettingsEditorParameters = {
			settings: settingsPart,
			defaultSettings: defaultSettingsPart,
			blueprint: blueprintPart,
			fullSettings: options.fullSettings,
		}

		addSettingsCategoryRow(tableMenu, key, optionsPart, saveConfig)
	}

	tableMenu.show()
}

function buildSettingsEditorForMap(
	tableMenu: TableMenu,
	options: {
		settings: GeneralizedSettings
		defaultSettings: GeneralizedSettings
		blueprint: SettingsMap<SettingsStructureBase>
		fullSettings: Settings
	},
	saveConfig: () => void
) {
	const { settings, defaultSettings, blueprint } = options

	tableMenu.reset()
	const titleRow = tableMenu.addTitleRow(blueprint.title)

	titleRow.addIconButton('➕', () => createSettingsMapEntry(tableMenu, options, saveConfig))

	log(`Config Editor: Building settings editor for Map "${blueprint.title}".`)

	// TODO(ux): show map key in title
	for (const key of Object.keys(settings)) {
		// skip the placeholder key from the default settings
		if (key === '_') continue
		const settingsPart = settings[key] as GeneralizedSettings

		let name = blueprint.nameFormatter ? blueprint.nameFormatter(key, settingsPart) : key
		const row = tableMenu.addTextRow(name)

		row.setOnTap(() => openSettingsEditorForMapKey(tableMenu, key, options, saveConfig))
	}

	tableMenu.show()
}

async function createSettingsMapEntry(tableMenu: TableMenu, options: SettingsEditorParameters, saveConfig: () => void) {
	console.log(`Config Editor: Creating new entry for Map "${options.blueprint.title}".`)

	// ask for the key
	const key = await askForSingleInput({
		title: 'Add entry',
		description: 'Enter the key for the new entry.',
		placeholder: 'Key',
		doneLabel: 'Add',
	})
	// exit if the user cancelled
	if (!key) return
	// check if the key already exists
	if (options.settings[key]) {
		showInfoPopup('❌ Key already exists', `The key "${key}" already exists.`)
		return
	}

	// add the key to the beginning of the settings (copying the default settings)
	options.settings[key] = { ...options.defaultSettings['_'] as GeneralizedSettings }
	// save the config
	// saveConfig()

	console.log(`Config Editor: Added new entry for Map "${options.blueprint.title}". (Key: "${key}")`)

	// open the editor for the new key
	openSettingsEditorForMapKey(tableMenu, key, options, saveConfig)
}

function openSettingsEditorForMapKey(
	tableMenu: TableMenu,
	key: string,
	options: SettingsEditorParameters,
	saveConfig: () => void
) {
	const newOptions: SettingsEditorParameters = {
		settings: options.settings[key] as GeneralizedSettings,
		defaultSettings: options.defaultSettings['_'] as GeneralizedSettings,
		blueprint: options.blueprint,
		fullSettings: options.fullSettings,
	}
	buildSettingsEditorForCategory(tableMenu.createSubView(), newOptions, saveConfig)
}

function addSettingsCategoryRow(
	tableMenu: TableMenu,
	key: string,
	options: {
		settings: GeneralizedSettings
		defaultSettings: GeneralizedSettings
		blueprint: SettingsCategory<SettingsStructureBase>
		fullSettings: Settings
	},
	saveConfig: () => void
) {
	const row = tableMenu.addTextRow(options.blueprint.title, options.blueprint.description)

	row.setOnTap(() => {
		// NOTE: typescript doesn't recognize the type guard of options.blueprint
		buildSettingsEditorForCategory(tableMenu.createSubView(), options as SettingsEditorParameters, saveConfig)
	})
}

function addSettingsMapRow(
	tableMenu: TableMenu,
	options: {
		settings: GeneralizedSettings | undefined
		defaultSettings: GeneralizedSettings
		blueprint: SettingsMap<SettingsStructureBase>
		fullSettings: Settings
	},
	saveConfig: () => void
) {
	const { settings, defaultSettings, blueprint } = options

	const row = tableMenu.addTextRow(blueprint.title, blueprint.description)

	row.setOnTap(() => {
		buildSettingsEditorForMap(
			tableMenu.createSubView(),
			{
				settings: settings,
				defaultSettings: defaultSettings,
				blueprint: blueprint,
				fullSettings: options.fullSettings,
			},
			saveConfig
		)
	})
}

function addSettingsValueRow(
	tableMenu: TableMenu,
	value: PrimitiveSettingsValue,
	defaultValue: PrimitiveSettingsValue,
	blueprint: SettingsValue,
	updateValue: (newValue: PrimitiveSettingsValue) => void
) {
	const row = tableMenu.addTextRow(blueprint.title, blueprint.description)

	let valueCell: TableMenuCell

	const isDefaultValue = value === defaultValue
	const formattedValue = formatValue(value, blueprint.type)
	let valueIndicator = formattedValue
	const formattedDefaultValue = formatValue(defaultValue, blueprint.type, true)
	let textOptions: TableMenuRowTextOptions = { width: 24 }
	// hide the default value if it's the same as the current value
	const defaultValueIndicator = isDefaultValue ? '' : formattedDefaultValue

	if (blueprint.type === SettingsValueType.COLOR) {
		const color = getColor(value as string)
		textOptions.color = color
		textOptions.font = Font.boldSystemFont(32)
		// use a square filled with the color as the value indicator
		valueIndicator = '■'
	}

	switch (blueprint.type) {
		case SettingsValueType.ON_OFF:
		case SettingsValueType.SHOW_HIDE:
			valueCell = row.addText(valueIndicator, defaultValueIndicator, textOptions)
			row.setOnTap(() => updateValue(!value))
			break
		default:
			valueCell = row.addText(valueIndicator, defaultValueIndicator, textOptions)
			row.setOnTap(async () => {
				const newValue = await openValueEditor(formattedValue, formattedDefaultValue, blueprint)
				log(`Config Editor: New value for "${blueprint.title}": ${newValue}`)
				if (!newValue) return
				updateValue(newValue)
			})
			break
	}

	if (!isDefaultValue) {
		const icon = defaultValue === undefined ? '🗑️' : '↩️'
		const buttonCell = row.addIconButton(icon, () => updateValue(defaultValue))
		valueCell.width -= buttonCell.width
	}
}

/**
 * Formats the given value according to its type to be displayed in a UI.
 * @param isSecondary returns text for the value, to make it less prominent
 */
function formatValue(value: PrimitiveSettingsValue, type: SettingsValueType, isSecondary = false) {
	if (value === undefined) return ''
	switch (type) {
		case SettingsValueType.DURATION:
			return Duration.fromSeconds(value as number).toString()
		case SettingsValueType.ON_OFF:
			if (isSecondary) return value ? 'on' : 'off'
			return value ? '✅' : '❌'
		case SettingsValueType.SHOW_HIDE:
			// TODO: find good show/hide emojis/icons
			if (isSecondary) return value ? 'visible' : 'hidden'
			// return value ? '👁️' : '⚫'
			return value ? '✅' : '❌'
		case SettingsValueType.STRING:
			return value as string
		case SettingsValueType.STRING_ARRAY:
			const array = value as string[]
			if (array.length === 0) return ''
			return `"${array.join('", "')}"`
		default:
			if (!value) return 'undefined'
			return value.toString()
	}
}
