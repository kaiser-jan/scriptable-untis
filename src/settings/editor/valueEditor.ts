import {
	PrimitiveSettingsValue as defaultValue,
	PrimitiveSettingsValue,
	SettingsValue,
	SettingsValueType,
} from '@/types/settings'
import { Duration } from '@/utils/duration'
import { askForSingleInput, parseArray, selectOption, showInfoPopup } from '@/utils/scriptable/input'

const LOCALE_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/

export async function openValueEditor(formattedValue: string, formattedDefaultValue: string, blueprint: SettingsValue) {
	const newValue = await openTextValueEditor(formattedValue.toString(), formattedDefaultValue, blueprint)

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
		case SettingsValueType.STRING:
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

export async function openBooleanEditor(settingsValue: SettingsValue) {
	try {
		const response = await selectOption(['true', 'false'], {
			title: settingsValue.title,
			description: settingsValue.description,
		})
		return response === 'true'
	} catch {
		return null
	}
}
