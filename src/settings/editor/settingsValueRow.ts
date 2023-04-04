import { PrimitiveSettingsValue, SettingsValue, SettingsValueType } from '@/types/settings'
import { Duration } from '@/utils/duration'
import { TableMenu } from '@/utils/scriptable/table/tableMenu'
import { TableMenuCell } from '@/utils/scriptable/table/tableMenuCell'
import { TableMenuRowTextOptions } from '@/utils/scriptable/table/tableMenuRow'
import { getColor } from '../colors'
import { openValueEditor } from './valueEditor'

/**
 * Adds a row which allows the user to change the given value.
 */
export function addSettingsValueRow(
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
