import { GithubRelease } from '@/types/github'
import { Duration } from './duration'
import { getModuleFileManager } from './scriptable/fileSystem'
import { KeychainManager } from './scriptable/keychainManager'
import { GITHUB_REPO, GITHUB_SCRIPT_NAME, GITHUB_USER } from '@/constants'

/**
 * Determines if the app should check for updates.
 * This will read the last time the app checked for updates from the keychain.
 * @param updateInterval the interval in milliseconds to check for updates.
 */
export function shouldCheckForUpdates(updateInterval: Duration) {
	const lastCheckISO = KeychainManager.get('lastUpdateCheck')

	if (!lastCheckISO) return true

	const now = new Date().getTime()
	const lastCheckDate = new Date(lastCheckISO).getTime()
	if (now - lastCheckDate > updateInterval.toMilliseconds()) {
		return true
	} else {
		log(`⏫⏭️ Skipping update as the last one was not too long ago. (${lastCheckISO})`)
	}
}

export async function checkForUpdates() {
	const API_KEY = KeychainManager.get('githubApiKey')
	checkForUpdatesWith(GITHUB_USER, GITHUB_REPO, GITHUB_SCRIPT_NAME, API_KEY)
}

/**
 * Checks for updates and updates if necessary.
 * 1. Check the keychain for the current version.
 * 2. Fetch the latest version from the GitHub API.
 * 3. Compare the versions. Update for fix & feature releases, notify the user for breaking releases.
 * 4. Write the current version to the keychain.
 * 5. Notify the user if the update was successful.
 * @param user the GitHub user
 * @param repo the GitHub repo
 * @param assetName the name of the asset (the script) to download
 * @returns true if the script was updated, false otherwise
 */
export async function checkForUpdatesWith(user: string, repo: string, assetName: string, apiKey?: string) {
	log('⏫❔ Checking for updates...')

	const currentVersion = KeychainManager.get('currentVersion')

	// get the latest version from the GitHub API
	const latestRelease = await getLatestRelease(user, repo, apiKey)

	KeychainManager.set('lastUpdateCheck', new Date().toISOString())

	if (!latestRelease) {
		// already logged in getLatestRelease
		return false
	}

	// exit if the current version is the latest version
	if (currentVersion === latestRelease.tag_name) {
		console.log('🟰 No update available.')
		return false
	}

	// parse the versions
	const latestVersionParsed = parseVersion(latestRelease.tag_name)
	const currentVersionParsed = currentVersion ? parseVersion(currentVersion) : null

	// update the script if the current version is not set
	// TODO: this could break when installing just before a major release
	// NOTE: but currently there is no way to get the current version
	if (!currentVersion) {
		console.log('⏫🟡 Current version not set. Updating to latest version.')
		const updateSuccessful = await updateScript(latestRelease, assetName, apiKey)
		return updateSuccessful
	}

	// compare the versions
	log('⏫ Comparing versions...')
	const versionComparison = compareVersions(currentVersionParsed, latestVersionParsed)

	if (versionComparison === 'equal') {
		console.log('⏫✅ Latest version already installed.')
		return false
	}

	// notify the user if the latest version is a breaking release
	if (versionComparison === 'breaking') {
		console.log('⏫🔴 Breaking update available.')
		// TODO: notify the user
		return false
	}

	// update the script if the latest version is a fix or feature release
	if (versionComparison === 'feature' || versionComparison === 'minor') {
		console.log('⏫🟢 Update available.')
		const updateSuccessful = await updateScript(latestRelease, assetName, apiKey)
		return updateSuccessful
	}

	return false
}

async function updateScript(latestRelease: GithubRelease, assetName: string, apiKey?: string) {
	// check if the latest release has an asset with the given name
	const asset = latestRelease.assets.find((asset) => asset.name === assetName)

	if (!asset) {
		console.error('⏫📦 Could not find script asset in latest release.')
		return false
	}

	// download the asset
	const request = new Request(asset.url)

	// we need to create a temporary variable, as keys of the headers object cannot be changed after assignment
	const headers: Record<string, string> = {
		// https://docs.github.com/en/rest/releases/assets?apiVersion=2022-11-28#get-a-release-asset
		Accept: 'application/octet-stream',
	}

	if (apiKey) {
		console.log('⏫🔑 Using API key to download latest release.')
		headers['Authorization'] = `Bearer ${apiKey}`
	}

	request.headers = headers

	const script = await request.loadString()

	try {
		const json = JSON.parse(script)
		if (json.message) {
			console.error(`⏫❌ Could not download latest release. ${json.message}`)
			return false
		}
	} catch {}

	if (!script || script.length === 0) {
		console.error('⏫❌ Could not download latest release, the received file is empty.')
		return false
	}

	console.log('⏫💾 Downloaded latest release, writing to files.')
	// replace the .scriptable extension with .js
	const fileName = assetName.replace('.scriptable', '.js')
	// save the script to the documents directory
	const fileManager = getModuleFileManager().fileManager
	const scriptPath = fileManager.joinPath(fileManager.documentsDirectory(), fileName)
	fileManager.writeString(scriptPath, script)

	// update the current version in the keychain
	KeychainManager.set('currentVersion', latestRelease.tag_name)

	console.log(`⏫✅ Script updated to version ${latestRelease.tag_name}`)

	return true
}

async function getLatestRelease(user: string, repo: string, apiKey?: string) {
	const url = `https://api.github.com/repos/${user}/${repo}/releases/latest`

	const request = new Request(url)
	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
	}

	if (apiKey) {
		console.log('⏫🔑 Using API key to fetch latest release.')
		headers['Authorization'] = `Bearer ${apiKey}`
	}

	request.headers = headers

	const json = await request.loadJSON()

	if (!json) return null

	if (json.message) {
		console.error(
			`⏫❌ Could not fetch latest release from GitHub API. (${json.message})\nPlease check your API key.`
		)
		return null
	}

	console.log(`⏫ Got latest release: ${json.tag_name}`)

	return json as GithubRelease
}

type Version = {
	breaking: number
	feature: number
	minor: number
}

/**
 * Parses a version tag (e.g. v1.2.3) into an object.
 * @param version the version tag
 * @returns the parsed version as { breaking: number, feature: number, minor: number}
 */
function parseVersion(version: string): Version {
	const sanitizedVersion = version.replace('v', '')
	const [breaking, feature, minor] = sanitizedVersion.split('.')
	return {
		breaking: parseInt(breaking),
		feature: parseInt(feature),
		minor: parseInt(minor),
	}
}

/**
 * Compares two versions.
 * Returns if the update is a breaking, feature or minor update.
 * @param currentVersion the current version
 * @param latestVersion the latest version
 */
function compareVersions(currentVersion: Version, latestVersion: Version) {
	if (currentVersion.breaking < latestVersion.breaking) return 'breaking'
	if (currentVersion.feature < latestVersion.feature) return 'feature'
	if (currentVersion.minor < latestVersion.minor) return 'minor'
	return 'equal'
}
