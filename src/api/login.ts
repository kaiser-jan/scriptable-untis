import { ErrorCode, createError } from '@/utils/errors'

export async function login(user: UserData, password: string) {
	console.log(`🔑 Logging in as ${user.username} in school ${user.school} on ${user.server}.webuntis.com`)

	const cookies = await fetchCookies(user, password)
	const token = await fetchBearerToken(user, cookies)
	const fullUser = await fetchUserData({ ...user, cookies, token })

	console.log(
		`🔓 Logged in as ${fullUser.displayName} (${fullUser.username}) in school ${fullUser.school} on ${fullUser.server}.webuntis.com`
	)

	return fullUser
}

async function fetchCookies(user: UserData, password: string) {
	const credentialBody = `school=${user.school}&j_username=${user.username}&j_password=${password}&token=`
	const jSpringUrl = `https://${user.server}.webuntis.com/WebUntis/j_spring_security_check`

	const request = new Request(jSpringUrl)
	request.method = 'POST'
	request.body = credentialBody
	request.headers = {
		Accept: 'application/json',
		'Content-Type': 'application/x-www-form-urlencoded',
	}

	await request.load()

	if (request.response.statusCode == 404) {
		throw createError(ErrorCode.NOT_FOUND)
	}

	const cookies = request.response.cookies.map((cookie: any) => `${cookie.name}=${cookie.value}`)

	if (!cookies) {
		throw createError(ErrorCode.NO_COOKIES)
	}

	console.log('🍪 Got cookies')

	return cookies
}

async function fetchBearerToken(user: UserData, cookies: string[]) {
	const url = `https://${user.server}.webuntis.com/WebUntis/api/token/new`

	const request = new Request(url)
	request.headers = {
		cookie: cookies.join(';'),
	}

	const token = await request.loadString()

	// throw a LOGIN_ERROR if the response contains the string "loginError"
	if (token.includes('loginError')) {
		throw createError(ErrorCode.LOGIN_ERROR)
	}

	if (!token) {
		throw createError(ErrorCode.NO_TOKEN)
	}

	console.log('🎟️ Got Bearer Token for Authorization')

	return token
}

async function fetchUserData(user: User) {
	const url = `https://${user.server}.webuntis.com/WebUntis/api/rest/view/v1/app/data`

	const request = new Request(url)
	request.headers = {
		Authorization: `Bearer ${user.token}`,
	}

	const json = await request.loadJSON()

	if (!json || !json.user) {
		throw createError(ErrorCode.NO_USER)
	}

	if (json.user.name !== user.username) {
		console.warn(`Username mismatch: ${json.user.name} !== ${user.username}`)
	}

	const fullUser: FullUser = {
		server: user.server,
		school: user.school,
		id: json.user.person.id,
		username: user.username,
		displayName: json.user.person.displayName,
		imageUrl: json.user.person.imageUrl,
		token: user.token,
		cookies: user.cookies,
	}

	console.log(`👤 Got data for user ${fullUser.username} (id: ${fullUser.id}).\n`)

	return fullUser
}
