import { GeneralizedConfig, Description, GeneralizedConfigDescription } from "@/types/config"
import { createConfigEditorFor } from "./configEditor"

export function addCategoryRow(
	table: UITable,
	key: string,
	config: GeneralizedConfig,
	defaultConfig: GeneralizedConfig,
	description: Description,
	saveFullConfig: () => void
) {
	const row = new UITableRow()
	row.dismissOnSelect = false
	row.height = 60

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
