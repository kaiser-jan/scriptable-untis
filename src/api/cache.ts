import { Options } from "@/preferences/config"
import { login } from "./login"
import { readKeychain } from "@/setup"

/**
 * Tries to read user data from the cache, or logs in if the cache is too old.
 * @param options
 * @returns
 */
export async function prepareUser(options: Options): Promise<FullUser> {
	const CACHE_KEY = 'user'

	const { json, cacheAge, cacheDate } = await readFromCache(CACHE_KEY)

	// if the cache is not too old, return the cached user
	if (json && cacheAge < options.config.cacheHours.user * 60 * 60 * 1000) {
		return JSON.parse(json)
	}

	// get the user data from the keychain
	const userData = await readKeychain(true)
	// log into untis
	const fetchedUser = await login(userData, userData.password)

	// write the user to the cache
	writeToCache({ ...fetchedUser, lastUpdated: new Date() }, CACHE_KEY)

	console.log('👤⬇️ Fetched user from untis and wrote to cache.')

	return fetchedUser
}

/**
 * Reads the given cache file, returns the data or an empty object.
 * @param cacheName the name of the cache file (without extension)
 * @returns the cached json, the cache age in milliseconds and the cache (modification) date or an empty object
 */
export async function readFromCache(cacheName: string) {
	const fileManager = FileManager.local()
	const cacheDirectory = fileManager.cacheDirectory()
	const untisCacheDirectory = fileManager.joinPath(cacheDirectory, 'untis')

	if (!fileManager.fileExists(untisCacheDirectory)) {
		console.log('Cache directory does not exist.')
		return {}
	}

	const cachePath = fileManager.joinPath(untisCacheDirectory, `${cacheName}.json`)
	const cacheExists = fileManager.fileExists(cachePath)

	if (!cacheExists) {
		console.log(`Cache for ${cacheName} does not exist.`)
		return {}
	}

	// read the meta data
	const cacheDate = new Date(fileManager.modificationDate(cachePath))
	const cacheAge = new Date().getTime() - cacheDate.getTime()

	console.log(`🗃️ Cache ${cacheName} is ${Math.round(cacheAge / 60_000)}minutes old.`)

	const json = fileManager.readString(cachePath)

	return { json, cacheAge, cacheDate }
}

/**
 * Writes the given data to the cache.
 * @param data the data to cache
 * @param cacheName the name of the cache file (without extension)
 */
export function writeToCache(data: Object, cacheName: string) {
	const fileManager = FileManager.local()
	const cacheDirectory = fileManager.cacheDirectory()
	const untisCacheDirectory = fileManager.joinPath(cacheDirectory, 'untis')
	if (!fileManager.fileExists(untisCacheDirectory)) {
		fileManager.createDirectory(untisCacheDirectory, true)
	}
	const cachePath = fileManager.joinPath(untisCacheDirectory, `${cacheName}.json`)
	fileManager.writeString(cachePath, JSON.stringify(data))
	console.log(`🗃️✏️ Wrote cache for ${cacheName}.`)
}

/**
 * Clears the cache by deleting the cache directory.
 */
export function clearCache() {
	const fileManager = FileManager.local()
	const cacheDirectory = fileManager.cacheDirectory()
	const untisCacheDirectory = fileManager.joinPath(cacheDirectory, 'untis')
	if (fileManager.fileExists(untisCacheDirectory)) {
		fileManager.remove(untisCacheDirectory)
	}
}
