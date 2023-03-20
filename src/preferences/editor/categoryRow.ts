import { GeneralizedConfig, Description, GeneralizedConfigDescription } from '@/types/config'
import { createConfigEditorFor } from './configEditor'
import { showSubjectListEditor } from './subjects/subjectsListEditor'
import { Config } from '../config'

export function addCategoryRow(
	table: UITable,
	key: string,
	configPart: GeneralizedConfig,
	defaultConfigPart: GeneralizedConfig,
	fullConfig: Config,
	descriptions: GeneralizedConfigDescription,
	saveFullConfig: () => void
) {
	const row = new UITableRow()
	row.dismissOnSelect = false
	row.height = 60

	const textCell = row.addText(descriptions._title, descriptions._description)
	textCell.subtitleColor = Color.gray()
	textCell.subtitleFont = Font.systemFont(12)
	textCell.titleFont = Font.mediumSystemFont(16)

	row.onSelect = () => {
		// show the subject list editor
		if (key === 'subjects') {
			showSubjectListEditor(fullConfig, saveFullConfig)
			return
		}

		createConfigEditorFor({ configPart, defaultConfig: defaultConfigPart, fullConfig, descriptions }, saveFullConfig)
	}

	table.addRow(row)
}
