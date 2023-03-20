import { ConfigValue, Description } from "@/types/config"
import { openValueEditor } from "./valueEditor"

export function addValueRow(
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
	row.height = 60
	const titleCell = row.addText(description._title, description._description)
	titleCell.widthWeight = 76
	titleCell.titleFont = Font.mediumSystemFont(16)
	titleCell.subtitleFont = Font.systemFont(12)
	titleCell.subtitleColor = Color.gray()

	// show the current value and the default value
	const valueCell = row.addText(configPart.toString(), isDefaultValue ? '' : defaultConfigPart.toString())
	valueCell.centerAligned()
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
		const newValue = await openValueEditor(configPart, defaultConfigPart, description)
		if (newValue === null) return
		changeValue(newValue)
	}
	table.addRow(row)
}
