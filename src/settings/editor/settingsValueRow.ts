import { PrimitiveSettingsValue, SettingsValue, SettingsValueType } from '@/types/settings'
import { Duration } from '@/utils/duration'
import { TableMenu } from '@/utils/scriptable/table/tableMenu'
import { TableMenuCell } from '@/utils/scriptable/table/tableMenuCell'
import { TableMenuRowTextOptions } from '@/utils/scriptable/table/tableMenuRow'
import { getColor, unparsedColors } from '../colors'
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

	const valueCell = row.addText(valueIndicator, defaultValueIndicator, textOptions)

	// TODO: catch errors in onTap
	switch (blueprint.type) {
		case SettingsValueType.ON_OFF:
		case SettingsValueType.SHOW_HIDE:
			row.setOnTap(() => updateValue(!value))
			break
		case SettingsValueType.COLOR:
			log('set as color')
			row.setOnTap(async () => {
				log('open color editor')
				openColorEditor(tableMenu, value as string, updateValue)
			})
			break

		default:
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

/**
 * Opens a new table subview which allows to select one of the background colors.
 */
function openColorEditor(tableMenu: TableMenu, value: string, updateValue: (newValue: string) => void) {
	// open a new table menu to select a color
	const colorTable = tableMenu.createSubView()
	colorTable.addTitleRow('🎨 Select a color')
	colorTable.addSpacerRow()

	// TODO: extend to selecting colors more generally (not from the backgrounds)
	// TODO: add something similar to a colorwheel (hue, saturation, brightness)
	// NOTE: it is not possible to use colored buttons: buttons cannot be colored, text cannot be tapped
	for (const colorName of Object.keys(unparsedColors.background)) {
		const color = unparsedColors.background[colorName]
		const row = colorTable.addTextRow(colorName)
		// also display the color code
		const colorCodeText = row.addText(color, '', {})
		colorCodeText.cell.titleColor = new Color('#A7B4B8')
		// color the row with the color
		row.setBackgroundColor(getColor(color))
		row.setOnTap(() => {
			updateValue(color)
			colorTable.showPreviousView()
		})
	}

	colorTable.show(false, false)
}