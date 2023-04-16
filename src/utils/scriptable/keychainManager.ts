/**
 * A class for managing the keychain.
 * The main benefit is that it will add a prefix to all keys, to avoid conflicts with other apps.
 * The prefix can be set when initializing the class. Only one instance can be created.
 * It also provides a method to safely get a value from the keychain, without throwing an error.
 */
export class KeychainManager {
	/**
	 * The prefix for all keys.
	 */
	private _prefix: string

	private static _instance: KeychainManager | undefined = undefined

	constructor(prefix: string) {
		if (KeychainManager._instance) {
			throw new Error(
				'KeychainManager is a singleton class. Use KeychainManager.getInstance() to get the instance.'
			)
		}
		KeychainManager._instance = this
		this._prefix = prefix
	}

	private static getInstance(): KeychainManager {
		if (!KeychainManager._instance) {
			throw new Error(
				'KeychainManager is a singleton class. You first need to initialize it by calling `new KeychainManager()`.'
			)
		}
		return KeychainManager._instance
	}

	private static getPath(key: string): string {
		const instance = KeychainManager.getInstance()
		return `${instance._prefix}-${key}`
	}

	/**
	 * Safely tries to get a value from the keychain.
	 * @param key the key to get the value for
	 * @returns the value for the key, or null if the key does not exist
	 */
	public static get(key: string): string | null {
		const keychainKey = KeychainManager.getPath(key)

		if (Keychain.contains(keychainKey)) {
			return Keychain.get(keychainKey)
		} else {
			return null
		}
	}

	/**
	 * Writes the given value to the keychain.
	 * @param key the key to set the value for
	 * @param value the value to set
	 */
	public static set(key: string, value: string) {
		const keychainKey = KeychainManager.getPath(key)
		Keychain.set(keychainKey, value)
	}
}
