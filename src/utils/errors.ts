import { colors } from '@/settings/colors'
import { addSymbol } from './scriptable/componentHelper'

type IErrorCodes = {
	[Property in ErrorCodes]: IErrorCode
}
interface IErrorCode {
	title: string
	description?: string
	icon?: string
}

type ErrorCodes =
	| 'NO_INTERNET'
	| 'NO_COOKIES'
	| 'LOGIN_ERROR'
	| 'NO_TOKEN'
	| 'NO_USER'
	| 'NOT_FOUND'
	| 'INVALID_WEBUNTIS_URL'
	| 'INPUT_CANCELLED'
	| 'SELECTION_CANCELLED'
	| 'SETUP_INCOMPLETE'

export const ErrorCode: IErrorCodes = {
	NO_INTERNET: { title: 'The internet connection appears to be offline.', icon: 'wifi.exclamationmark' },
	NO_COOKIES: { title: 'Could not get cookies.', description: 'Please check your credentials!', icon: 'key' },
	LOGIN_ERROR: { title: 'Could not login.', description: 'Please check your credentials!', icon: 'lock.circle' },
	NO_TOKEN: { title: 'Could not get token.', description: 'Please check your credentials!', icon: 'key' },
	NO_USER: {
		title: 'Could not get user.',
		description: 'Please check your credentials!',
		icon: 'person.fill.questionmark',
	},
	NOT_FOUND: { title: 'Got 404 Error.', description: 'WebUntis seems to be offline...', icon: 'magnifyingglass' },
	INVALID_WEBUNTIS_URL: {
		title: 'Invalid WebUntis URL',
		description: 'Please check your WebUntis URL!',
		icon: 'link',
	},
	INPUT_CANCELLED: { title: 'Input cancelled', description: 'Please try again!', icon: 'xmark.octagon' },
	SELECTION_CANCELLED: { title: 'Selection cancelled', description: 'Please try again!', icon: 'xmark.octagon' },
	SETUP_INCOMPLETE: { title: 'Setup incomplete', description: 'Please complete the setup!', icon: 'hammer.circle' },
}

/**
 * Contains the ErrorCode object for some (lowercase) scriptable error messages
 */
export const SCRIPTABLE_ERROR_MAP: Record<string, typeof ErrorCode[keyof typeof ErrorCode]> = {
	'the internet connection appears to be offline.': ErrorCode.NO_INTERNET,
	// TODO: find the correct wording
	'the request timed out.': ErrorCode.NO_INTERNET,
	'the network connection was lost.': ErrorCode.NO_INTERNET,
	'a data connection is not currently allowed.': ErrorCode.NO_INTERNET,
}

export interface ExtendedError extends Error {
	icon?: string
}

/**
 * Creates an error from the given code.
 * @param errorCode
 * @returns an Error to be thrown
 */
export function createError(errorCode: IErrorCode) {
	const error = new Error() as ExtendedError
	error.name = errorCode.title
	if (errorCode.description) {
		error.message = errorCode.description
	}
	if (errorCode.icon) {
		error.icon = errorCode.icon
	}
	return error
}

export function createErrorWidget(title: string, description: string, icon?: string) {
	const widget = new ListWidget()
	widget.backgroundColor = Color.black()

	const content = widget.addStack()
	content.layoutVertically()
	content.centerAlignContent()

	if (icon) {
		addSymbol(icon, content, { color: colors.text.red, size: 40 })
		content.addSpacer(8)
	}

	const errorTitle = widget.addText(title)
	errorTitle.font = Font.mediumSystemFont(18)
	errorTitle.textColor = colors.text.red

	if (description && description !== '') {
		const errorDescription = widget.addText(description)
		errorDescription.font = Font.regularSystemFont(14)
		errorDescription.textColor = colors.text.red
	}

	return widget
}
