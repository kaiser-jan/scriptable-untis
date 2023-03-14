import { ErrorCode } from "./utils/errors"

const keychainRequestStrings = {
	school: {
		title: 'WebUntis School & Server',
		description:
			'Please visit https://webuntis.com/ and select your school. Then paste the url you were redirected to here.',
		placeholder: 'https://server.webuntis.com/WebUntis/?school=schoolname',
	},
	username: {
		title: 'WebUntis Username',
		description: 'The username you use to login to WebUntis.',
		placeholder: 'username',
	},
	password: {
		title: 'WebUntis Password',
		description: 'The password you use to login to WebUntis. It will be stored in your keychain.',
		placeholder: 'password',
	},
}

type AvailableKeychainEntries = keyof typeof keychainRequestStrings | 'server'

const usernamePlaceholders: Record<string, string> = {
	litec: '401467',
}

export async function readKeychain(requestMissing: boolean = false) {
	if (requestMissing) {
		const server = await getFromKeychain('server')
		const school = await getFromKeychain('school')
		const username = await getFromKeychain('username', usernamePlaceholders[school ?? ''] ?? '')
		const password = await getFromKeychain('password')

		return { server, school, username, password }
	} else {
		return {
			server: Keychain.get('webuntis-server'),
			school: Keychain.get('webuntis-school'),
			username: Keychain.get('webuntis-username'),
			password: Keychain.get('webuntis-password'),
		}
	}
}

export async function writeKeychain() {
	const initialUser = await readKeychain(false)

	await requestKeychainEntry('school', initialUser.school)
	await requestKeychainEntry('username', initialUser.username ?? usernamePlaceholders[initialUser.school ?? ''] ?? '')
	await requestKeychainEntry('password')
}

async function getFromKeychain(key: AvailableKeychainEntries, defaultValue: string = '') {
	const keychainKey = `webuntis-${key}`
	if (Keychain.contains(keychainKey)) {
		return Keychain.get(keychainKey)
	} else {
		return requestKeychainEntry(key, defaultValue)
	}
}

async function requestKeychainEntry(key: AvailableKeychainEntries, defaultValue = '') {
	switch (key) {
		case 'school':
		case 'server':
			const webuntisUrl = await askForInput({ ...keychainRequestStrings['school'], defaultValue })
			// get the server and school from the input
			const regex = /https:\/\/(.+?)\.webuntis\.com\/WebUntis\/\?school=(\w+).*/
			const match = webuntisUrl.match(regex)
			if (match) {
				const [, server, school] = match
				Keychain.set('webuntis-server', server)
				Keychain.set('webuntis-school', school)
				return school
			}
			throw createError(ErrorCode.INVALID_WEBUNTIS_URL)
		case 'username':
		case 'password':
			const input = await askForInput({ ...keychainRequestStrings[key], defaultValue })
			Keychain.set(`webuntis-${key}`, input)
			return input
	}
}

async function askForInput(options: {
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

function createError(INVALID_WEBUNTIS_URL: any) {
	throw new Error("Function not implemented.")
}
