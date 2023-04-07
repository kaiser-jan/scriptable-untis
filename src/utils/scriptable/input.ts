import { createError, ErrorCode } from '../errors'

interface AlertOptions {
	title?: string
	description?: string
	doneLabel?: string
	cancelLabel?: string
}

function createAlert(options: AlertOptions) {
	let alert = new Alert()
	alert.title = options.title
	alert.message = options.description
	alert.addAction(options.doneLabel ?? 'OK')
	alert.addCancelAction(options.cancelLabel ?? 'Cancel')
	return alert
}

export async function askForSingleInput(
	options: AlertOptions & {
		placeholder: string
		defaultValue?: string
		isSecure?: boolean
	}
) {
	const alert = createAlert(options)

	const textField = alert.addTextField(options.placeholder, options.defaultValue)
	textField.isSecure = options.isSecure ?? false

	const responseIndex = await alert.presentAlert()

	if (responseIndex !== 0) return null

	return alert.textFieldValue(0)
}

export interface InputOptions<T> {
	key: keyof T
	placeholder: string
	defaultValue?: string
	isSecure?: boolean
}

export type InputPreparedType<T> = {
	[K in keyof T]: string
}

export function stringifyArray(array: string[]) {
	return `"${array.join('", "')}"`
}

/**
 * Parses an array from a string. Returns undefined if the string is empty.
 * @param arrayString the string as e.g.: "a", "b", "c"
 * @returns the array as e.g.: ["a", "b", "c"]
 */
export function parseArray(arrayString: string): string[] | undefined {
	if (!arrayString || arrayString === '') return undefined
	return arrayString.split(',').map((s) => s.trim().replace(/^"(.*)"$/, '$1'))
}

/**
 * Asks the user to input one or more values.
 * @returns a value with the correct type for each input
 */
export async function askForInput<T>(
	options: AlertOptions & {
		inputs: InputOptions<T>[]
	}
): Promise<Record<keyof T, string>> {
	let alert = createAlert(options)

	for (const input of options.inputs) {
		const textField = alert.addTextField(input.placeholder, input.defaultValue)
		textField.isSecure = input.isSecure ?? false
	}

	const responseIndex = await alert.presentAlert()

	if (responseIndex !== 0) return null

	// if this is not initialized, js crashes without an error
	let results: Record<keyof T, string> = {} as any

	options.inputs.forEach((input, index) => {
		results[input.key] = alert.textFieldValue(index)
		if (results[input.key] === '') results[input.key] = undefined
	})

	return results
}

/**
 * Allows the user to select one of the available options.
 * @param availableOptions the options to choose from
 * @param options options for the text shown in the prompt
 * @returns the selected option or null if the user cancels the selection
 */
export async function selectOption(
	availableOptions: string[],
	options: {
		title?: string
		description?: string
	}
): Promise<string | null> {
	let alert = new Alert()

	alert.title = options.title ?? 'Select an Option'
	alert.message = options.description ?? 'Choose one of the following widgetConfig:'

	for (let option of availableOptions) {
		alert.addAction(option)
	}

	alert.addCancelAction('Cancel')

	const responseIndex = await alert.presentSheet()

	if (responseIndex === -1) {
		return null
	}

	return availableOptions[responseIndex]
}

export async function showInfoPopup(title: string, description: string) {
	let alert = new Alert()
	alert.title = title
	alert.message = description
	alert.addAction('OK')
	await alert.presentAlert()
}
