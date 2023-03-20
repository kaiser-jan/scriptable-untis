import { ErrorCode, createError } from './utils/errors'
import { askForInput, askForSingleInput } from './utils/scriptable/input'

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
	const server = await getFromKeychain('server', requestMissing)
	const school = await getFromKeychain('school', requestMissing)
	const username = await getFromKeychain('username', requestMissing, usernamePlaceholders[school ?? ''] ?? '')
	const password = await getFromKeychain('password', requestMissing)

	return { server, school, username, password }
}

export async function writeKeychain() {
	const initialUser = await readKeychain(false)
	await requestKeychainEntry('school', initialUser.school)
	let defaultUsername = initialUser.username
	if (!defaultUsername && initialUser.school) {
		defaultUsername = usernamePlaceholders[initialUser.school]
	}
	await requestKeychainEntry('username', defaultUsername)
	await requestKeychainEntry('password')
}

async function getFromKeychain(
	key: AvailableKeychainEntries,
	requestMissing: boolean = false,
	defaultValue: string = ''
): Promise<string | undefined> {
	const keychainKey = `webuntis-${key}`
	if (Keychain.contains(keychainKey)) {
		return Keychain.get(keychainKey)
	} else if (requestMissing) {
		return requestKeychainEntry(key, defaultValue)
	} else {
		return defaultValue
	}
}

async function requestKeychainEntry(key: AvailableKeychainEntries, defaultValue = '') {
	switch (key) {
		case 'school':
		case 'server':
			const webuntisUrl = await askForSingleInput({ ...keychainRequestStrings['school'], defaultValue })
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
			const input = await askForSingleInput({
				...keychainRequestStrings[key],
				defaultValue,
				isSecure: key === 'password',
			})
			Keychain.set(`webuntis-${key}`, input)
			return input
	}
}
