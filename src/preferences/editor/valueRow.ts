import { ConfigValue, Description } from "@/types/config"
import { openValueEditor } from "./valueEditor"

/**
 * Adds a row to the table that allows the user to edit a value.
 * @param changeValue a function that updates the value in the config and the UI
 */
export function addValueRow(
	table: UITable,
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

	let formattedValue = configPart.toString()
	if (typeof defaultConfigPart === 'boolean') {
		// make sure the value is a boolean, as the user could enter anything in the file
		configPart = configPart === true
		formattedValue = configPart ? '✅' : '❌'
	}

	// show the current value and the default value
	const valueCell = row.addText(formattedValue, isDefaultValue ? '' : defaultConfigPart.toString())
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
		// edit the value
		const newValue = await openValueEditor(configPart, defaultConfigPart, description)
		// exit if the user cancelled
		if (newValue === null) return
		// update the config and the UI
		changeValue(newValue)
	}

	table.addRow(row)
}
