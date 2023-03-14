interface UserData {
	server: string
	school: string
	username: string
}

interface User extends UserData {
	cookies: string[]
	token: string
}

interface FullUser extends User {
	id: number
	displayName: string
	imageUrl: string
}

interface CachedUser extends FullUser {
	lastUpdated: Date
}
