import { ConfigValue, Description } from '@/types/config'
import { askForSingleInput, selectOption, showInfoPopup } from '@/utils/scriptable/input'

export async function openValueEditor(
	configPart: ConfigValue,
	defaultConfigPart: ConfigValue,
	description: Description
) {
	switch (typeof defaultConfigPart) {
		case 'string':
			return openTextValueEditor(configPart as string, defaultConfigPart, description)
		case 'number':
			const value = await openTextValueEditor(configPart.toString(), defaultConfigPart, description)
			// check if the value is a number
			if (isNaN(Number(value))) {
				showInfoPopup('❌ Invalid number', `The value you entered (${value}) is not a number.`)
				return null
			}
			return parseFloat(value)
		case 'boolean':
			// simply invert the value for booleans to toggle them
			return !configPart
		default:
			throw new Error(`Cannot open value editor for unknown type ${typeof configPart}`)
	}
}

export async function openTextValueEditor(
	value: string | number,
	defaultValue: string | number,
	description: Description
) {
	return await askForSingleInput({
		title: description._title,
		description: description._description,
		placeholder: defaultValue.toString(),
		defaultValue: value.toString(),
	})
}

export async function openBooleanEditor(description: Description) {
	try {
		const response = await selectOption(['true', 'false'], {
			title: description._title,
			description: description._description,
		})
		return response === 'true'
	} catch {
		return null
	}
}