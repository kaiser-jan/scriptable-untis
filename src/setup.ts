import { ErrorCode, createError } from './utils/errors'
import { askForSingleInput } from './utils/scriptable/input'
import { KeychainManager } from './utils/scriptable/keychainManager'

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
		description: 'The password you use to login to WebUntis. It will be stored in the Scriptable-Keychain.',
		placeholder: 'password',
	},
}

enum LoginDataKeys {
	SERVER = 'server',
	SCHOOL = 'school',
	USERNAME = 'username',
	PASSWORD = 'password',
}

type AvailableKeychainEntries = keyof typeof keychainRequestStrings | 'server'

type LoginData = Record<AvailableKeychainEntries, string>

const usernamePlaceholders: Record<string, string> = {
	litec: '401467',
}

export async function readLoginDataFromKeychain() {
	const server = KeychainManager.get(LoginDataKeys.SERVER)
	const school = KeychainManager.get(LoginDataKeys.SCHOOL)
	const username = KeychainManager.get(LoginDataKeys.USERNAME)
	const password = KeychainManager.get(LoginDataKeys.PASSWORD)

	let loginData: LoginData = { server, school, username, password }

	if (config.runsInApp) {
		// if the script is running in the app, we can ask the user to fill in the missing data
		loginData = await fillLoginDataInKeychain(loginData)
	}

	return loginData
}

export async function fillLoginDataInKeychain(user: LoginData) {
	const filledUser = { ...user }

	if (!user.server || !user.school) {
		const { server, school } = await askForServerAndSchool()
		filledUser.server = server
		filledUser.school = school
	}

	// use the current username if available
	let defaultUsername = user.username
	// otherwise, use a default value for the current school
	if (!defaultUsername && user.school) {
		defaultUsername = usernamePlaceholders[user.school]
	}

	if (!user.username) {
		filledUser.username = await askForUsername(defaultUsername)
	}

	if (!user.password) {
		filledUser.password = await askForPassword()
	}

	return filledUser
}

async function askForServerAndSchool() {
	const webuntisUrl = await askForSingleInput({ ...keychainRequestStrings['school'] })

	// get the server and school from the input
	const regex = /https:\/\/(.+?)\.webuntis\.com\/WebUntis\/\?school=(\w+).*/
	const match = webuntisUrl.match(regex)

	if (match) {
		const [, server, school] = match
		KeychainManager.set(LoginDataKeys.SERVER, server)
		KeychainManager.set(LoginDataKeys.SCHOOL, school)
		return { server, school }
	}

	throw createError(ErrorCode.INVALID_WEBUNTIS_URL)
}

async function askForUsername(defaultValue: string) {
	const input = await askForSingleInput({
		...keychainRequestStrings['username'],
		defaultValue,
	})
	KeychainManager.set(LoginDataKeys.USERNAME, input)
	return input
}

async function askForPassword() {
	const input = await askForSingleInput({
		...keychainRequestStrings['password'],
		isSecure: true,
	})
	KeychainManager.set(LoginDataKeys.PASSWORD, input)
	return input
}
