import {
	GeneralizedSettings,
	GeneralizedSettingsMap,
	SettingsEditorParameters,
	SettingsMap,
	SettingsStructureBase,
} from '@/types/settings'
import { askForSingleInput, showInfoPopup } from '@/utils/scriptable/input'
import { TableMenu } from '@/utils/scriptable/table/tableMenu'
import { Settings } from '../settings'
import { buildSettingsEditorFor } from './settingsEditor'

/**
 * Retrieves the map entry for the given key and opens the settings editor for it.
 */
function showSettingsEditorForMap(
	tableMenu: TableMenu,
	key: string,
	options: SettingsEditorParameters<GeneralizedSettingsMap>,
	saveConfig: () => void,
	backFunction: () => void
) {
	const newOptions: SettingsEditorParameters<GeneralizedSettingsMap> = {
		settings: options.settings[key] as GeneralizedSettings,
		defaultSettings: options.defaultSettings['_'] as GeneralizedSettings,
		blueprint: options.blueprint,
		fullSettings: options.fullSettings,
	}
	buildSettingsEditorFor(tableMenu.createSubView(backFunction), newOptions, saveConfig)
}

/**
 * Builds the settings editor to edit the given map.
 * This allows the user to add, remove and edit entries.
 * The entries are handled like categories.
 */
export function buildSettingsEditorForMap(
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

	// TODO: use a regular button
	titleRow.addIconButton('➕ add', () => createSettingsMapEntry(tableMenu, options, saveConfig), 15)

	log(`Config Editor: Building settings editor for Map "${blueprint.title}".`)

	// TODO(ux): show map key in title
	for (const key of Object.keys(settings)) {
		// skip the placeholder key from the default settings
		if (key === '_') continue
		const settingsPart = settings[key] as GeneralizedSettings

		// either use the custom name formatter or the key as name
		const name = blueprint.nameFormatter ? blueprint.nameFormatter(key, settingsPart) : key

		const row = tableMenu.addTextRow(name)

		// add a delete button
		row.addIconButton('🗑️', () => {
			delete settings[key]
			saveConfig()
			buildSettingsEditorForMap(tableMenu, options, saveConfig)
		})

		// open the settings editor for this map entry on tap
		row.setOnTap(() =>
			showSettingsEditorForMap(tableMenu, key, options, saveConfig, () => {
				// reload the map list, so the values are updated
				buildSettingsEditorForMap(tableMenu, options, saveConfig)
			})
		)
	}

	tableMenu.show()
}

/**
 * Adds a row for opening the settings editor for the given map in the given settings editor.
 */
export function addSettingsMapRow(
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

/**
 * Creates a new entry for the given map by asking the user for a key and opening the settings editor for the new entry.
 */
async function createSettingsMapEntry(
	tableMenu: TableMenu,
	options: SettingsEditorParameters<GeneralizedSettingsMap>,
	saveConfig: () => void
) {
	console.log(`Config Editor: Creating new entry for Map "${options.blueprint.title}".`)

	// ask for the key
	const key = await askForSingleInput({
		title: options.blueprint.addItemTitle ?? 'Add entry',
		description: options.blueprint.addItemDescription ?? 'Enter the key for the new entry.',
		placeholder: options.blueprint.addItemPlaceholder ?? 'Key',
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
	options.settings[key] = { ...(options.defaultSettings['_'] as GeneralizedSettings) }
	// save the config
	// saveConfig()
	console.log(`Config Editor: Added new entry for Map "${options.blueprint.title}". (Key: "${key}")`)

	// open the editor for the new key
	showSettingsEditorForMap(tableMenu, key, options, saveConfig, () => {
		// reload the map list, so the values are updated
		buildSettingsEditorForMap(tableMenu, options, saveConfig)
	})
}
