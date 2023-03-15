import { createError, ErrorCode } from "../errors"

export async function askForInput(options: {
	title: string
	description: string
	placeholder: string
	defaultValue: string
	isSecure?: boolean
}): Promise<string> {
	let alert = new Alert()
	alert.title = options.title
	alert.message = options.description

	const textField = alert.addTextField(options.placeholder, options.defaultValue)
	textField.isSecure = options.isSecure ?? false

	alert.addAction('OK')
	alert.addCancelAction('Cancel')

	const responseIndex = await alert.presentAlert()

	if (responseIndex === 0) {
		return alert.textFieldValue(0)
	} else {
		throw createError(ErrorCode.INPUT_CANCELLED)
	}
}

export async function selectOption(
	availableOptions: string[],
	options: {
		title?: string
		description?: string
	}
): Promise<string> {
	let alert = new Alert()

	alert.title = options.title ?? 'Select an Option'
	alert.message = options.description ?? 'Choose one of the following options:'

	for (let option of availableOptions) {
		alert.addAction(option)
	}

	alert.addCancelAction('Cancel')

	const responseIndex = await alert.presentSheet()

	if (responseIndex === -1) {
		throw createError(ErrorCode.SELECTION_CANCELLED)
	}

	return availableOptions[responseIndex]
}
