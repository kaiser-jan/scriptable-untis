import { PrimitiveSettingsValue, SettingsValue, SettingsValueType } from '@/types/settings'
import { Duration } from '@/utils/duration'
import { askForSingleInput, parseArray, showInfoPopup } from '@/utils/scriptable/input'

const LOCALE_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/

export async function openValueEditor(formattedValue: string, formattedDefaultValue: string, blueprint: SettingsValue) {
	let displayedValue = formattedValue

	// clear the value if it's a secure string
	if (blueprint.type === SettingsValueType.SECURE_STRING) {
		displayedValue = ''
	}

	const newValue = await openTextValueEditor(displayedValue, formattedDefaultValue, blueprint)

	// return null if the user cancels the input
	if (newValue === null) return null

	switch (blueprint.type) {
		case SettingsValueType.LOCALE:
			// check if the value is a valid locale (using regex)
			if (!newValue.match(LOCALE_REGEX)) {
				showInfoPopup('❌ Invalid locale', `The locale should be in a format like "de-AT".`)
				return null
			}
			return newValue
		case SettingsValueType.COUNT:
			// check if the value is a number
			if (isNaN(Number(newValue))) {
				showInfoPopup('❌ Invalid number', `The value you entered (${newValue}) is not a number.`)
				return null
			}
			return parseFloat(newValue)

		case SettingsValueType.DURATION:
			try {
				// parse the duration string
				return Duration.fromString(newValue).toSeconds()
			} catch {
				showInfoPopup(
					'❌ Invalid duration',
					`The duration should be a number followed by the unit. (e.g. "5m", "2h", "1wk")`
				)
				return null
			}
		case SettingsValueType.DATETIME:
			// check if the value is a valid date
			if (isNaN(Date.parse(newValue))) {
				showInfoPopup('❌ Invalid date', `The date you entered (${newValue}) is not a valid date.`)
				return null
			}
			// TODO: consider returning the parsed date
			return newValue
		case SettingsValueType.STRING:
		case SettingsValueType.SECURE_STRING:
		case SettingsValueType.COLOR:
			return newValue
		case SettingsValueType.STRING_ARRAY:
			return parseArray(newValue)

		default:
			throw new Error(`Cannot open value editor for unknown type ${typeof newValue}`)
	}
}

export async function openTextValueEditor(
	value: PrimitiveSettingsValue,
	defaultValue: PrimitiveSettingsValue,
	settingsValue: SettingsValue
) {
	return await askForSingleInput({
		title: settingsValue.title,
		description: settingsValue.description,
		placeholder: defaultValue.toString(),
		defaultValue: value.toString(),
	})
}
