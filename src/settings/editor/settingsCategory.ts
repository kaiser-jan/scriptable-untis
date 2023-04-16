import { GeneralizedSettingsCategory, SettingsEditorParameters } from '@/types/settings'
import { TableMenu } from '@/utils/scriptable/table/tableMenu'
import { buildSettingsEditorFor } from './settingsEditor'

/**
 * Adds a row which allows to open the settings for the given category.
 */
export function addSettingsCategoryRow(
	tableMenu: TableMenu,
	options: SettingsEditorParameters<GeneralizedSettingsCategory>,
	saveConfig?: () => void
) {
	const row = tableMenu.addTextRow(options.blueprint.title, options.blueprint.description)

	row.setOnTap(() => {
		buildSettingsEditorFor(tableMenu.createSubView(), options, saveConfig)
	})
}
