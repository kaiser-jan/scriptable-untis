import {
	GeneralizedConfig,
	Description,
	GeneralizedConfigDescription,
	BackFunctionType,
	SaveFullConfigFunction,
	ConfigEditorOptions,
} from '@/types/config'
import { createConfigEditorFor, updateConfigEditor } from './configEditor'
import { showSubjectListEditor } from './subjects/subjectsListEditor'
import { Config } from '../config'

export function addCategoryRow(
	table: UITable,
	key: string,
	options: ConfigEditorOptions,
	saveFullConfig: SaveFullConfigFunction,
	backFunction?: BackFunctionType
) {
	const row = new UITableRow()
	row.dismissOnSelect = false
	row.height = 60

	const textCell = row.addText(options.descriptionsPart._title, options.descriptionsPart._description)
	textCell.subtitleColor = Color.gray()
	textCell.subtitleFont = Font.systemFont(12)
	textCell.titleFont = Font.mediumSystemFont(16)

	row.onSelect = () => {
		// show the subject list editor
		if (key === 'subjects') {
			showSubjectListEditor(table, options.fullConfig, saveFullConfig, backFunction)
			return
		}

		// show the config editor for the category
		updateConfigEditor(table, options, saveFullConfig, backFunction)
	}

	table.addRow(row)
}
