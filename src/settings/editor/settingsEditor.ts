import {
	GeneralizedSettings,
	GeneralizedSettingsEntry,
	PrimitiveSettingsValue,
	SettingsCategory,
	SettingsEditorParameters,
	SettingsStructureBase,
	SettingsValue,
	SettingsValueType,
	isPrimitiveSettingsValue,
	isSettingsValue,
} from '@/types/settings'
import { getModuleFileManager, readConfig, writeConfig } from '@/utils/scriptable/fileSystem'
import { TableMenu } from '@/utils/scriptable/table/tableMenu'
import { TableMenuCell } from '@/utils/scriptable/table/tableMenuCell'
import { Settings, defaultSettings } from '../settings'
import { settingsBlueprint } from './settingsBlueprint'
import { openValueEditor } from './valueEditor'
import { Duration } from '@/utils/duration'

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

export function buildSettingsEditorFor(
	tableMenu: TableMenu,
	options: {
		settings: GeneralizedSettings
		defaultSettings: GeneralizedSettings
		blueprint: SettingsCategory<SettingsStructureBase>
		fullSettings: Settings
	},
	saveConfig: () => void
) {
	const { settings, defaultSettings, blueprint } = options

	tableMenu.reset()
	tableMenu.addTitleRow(blueprint.title)

	log(`Config Editor: Building settings editor for "${blueprint.title}".`)

	for (const key of Object.keys(blueprint.items)) {
		const settingsPart = settings[key as keyof typeof settings]
		const defaultSettingsPart = defaultSettings[key as keyof typeof defaultSettings]
		// TODO(types): typescript doesn't recognize the union type in the conditional type in the SettingsList types
		const blueprintPart = blueprint.items[key]

		function updateValue(newValue: PrimitiveSettingsValue) {
			// modify this value in the config
			settings[key] = newValue
			console.log(`Config Editor: Set "${key}" to "${newValue}".`)
			saveConfig()
			buildSettingsEditorFor(tableMenu, options, saveConfig)
		}

		// if this is a value, add a row for it
		if (isSettingsValue(blueprintPart)) {
			// type guards, even though they should be unnecessary
			if (!isPrimitiveSettingsValue(settingsPart)) throw new Error(`Settings part "${key}" is not a value.`)
			if (!isPrimitiveSettingsValue(defaultSettingsPart))
				throw new Error(`Default settings part "${key}" is not a value.`)

			addSettingsValue(tableMenu, settingsPart, defaultSettingsPart, blueprintPart, updateValue)
			continue
		}

		// otherwise, add a row for the category

		// type guards, even though they should be unnecessary
		if (isPrimitiveSettingsValue(settingsPart)) throw new Error(`Settings part "${key}" is not a category.`)
		if (isPrimitiveSettingsValue(defaultSettingsPart))
			throw new Error(`Default settings part "${key}" is not a category.`)

		const optionsPart: SettingsEditorParameters = {
			settings: settingsPart,
			defaultSettings: defaultSettingsPart,
			blueprint: blueprintPart,
			fullSettings: options.fullSettings,
		}

		addSettingsCategory(tableMenu, key, optionsPart, saveConfig)
	}

	tableMenu.show()
}

function addSettingsCategory(
	tableMenu: TableMenu,
	key: string,
	options: SettingsEditorParameters,
	saveConfig: () => void
) {
	const row = tableMenu.addTextRow(options.blueprint.title, options.blueprint.description)

	row.setOnTap(() => {
		// show the subject list editor
		if (key === 'subjects') {
			// TODO: implement
			// showSubjectListEditor(table, options.fullConfig, saveFullConfig, backFunction)
			return
		}

		log(`Config Editor: Building settings editor for category "${key}".`)

		buildSettingsEditorFor(tableMenu.createSubView(), options, saveConfig)
	})
}

function addSettingsValue(
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
	const formattedDefaultValue = formatValue(defaultValue, blueprint.type, true)
	// hide the default value if it's the same as the current value
	const defaultValueIndicator = isDefaultValue ? '' : formattedDefaultValue

	switch (blueprint.type) {
		case SettingsValueType.ON_OFF:
		case SettingsValueType.SHOW_HIDE:
			valueCell = row.addText(formattedValue, defaultValueIndicator, { width: 24 })
			row.setOnTap(() => updateValue(!value))
			break
		default:
			valueCell = row.addText(formattedValue, defaultValueIndicator, { width: 24 })
			row.setOnTap(async () => {
				const newValue = await openValueEditor(formattedValue, formattedDefaultValue, blueprint)
				if (!newValue) return
				updateValue(newValue)
			})
			break
	}

	if (value !== defaultValue) {
		const buttonCell = row.addIconButton('↩️', () => updateValue(defaultValue))
		valueCell.width -= buttonCell.width
	}
}

/**
 * Formats the given value according to its type to be displayed in a UI.
 * @param isSecondary returns text for the value, to make it less prominent
 */
function formatValue(value: PrimitiveSettingsValue, type: SettingsValueType, isSecondary = false) {
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
		default:
			return value.toString()
	}
}
