import { clearCache, prepareUser } from '@/api/cache'
import {
	GITHUB_REPO,
	GITHUB_SCRIPT_NAME,
	GITHUB_USER,
	PREVIEW_WIDGET_SIZE,
	SCRIPT_START_DATETIME,
	UPDATE_INTERVAL,
} from '@/constants'
import { getLayout } from '@/layout'
import { openSettings } from '@/settings/editor/settingsEditor'
import { writeKeychain } from '@/setup'
import { createErrorWidget, ExtendedError, SCRIPTABLE_ERROR_MAP } from '@/utils/errors'
import { getModuleFileManager as getFileManagerOptions, readConfig } from '@/utils/scriptable/fileSystem'
import { selectOption } from '@/utils/scriptable/input'
import { KeychainManager } from '@/utils/scriptable/keychainManager'
import { checkForUpdates, shouldCheckForUpdates } from '@/utils/updater'
import { createWidget } from '@/widget'

// initialize the keychain manager
new KeychainManager('untis')
const API_KEY = KeychainManager.get('githubApiKey')

// check for updates (in a try-catch block to prevent the script from crashing if the update fails)
try {
	if (shouldCheckForUpdates(UPDATE_INTERVAL)) {
		await checkForUpdates(GITHUB_USER, GITHUB_REPO, GITHUB_SCRIPT_NAME, API_KEY)
	}
} catch (error) {
	console.error('⏫❌ Could not check for updates.')
	log(error)
}

async function setupAndCreateWidget() {
	const { useICloud, fileManager } = getFileManagerOptions()
	const widgetConfig = await readConfig(useICloud)
	const user = await prepareUser(widgetConfig)
	const widget = await createWidget(user, getLayout(), widgetConfig)
	return widget
}

enum ScriptActions {
	VIEW = '💻 Show Widget',
	CHANGE_CREDENTIALS = '🔑 Change Credentials',
	EDIT_CONFIG = '🛠️ Edit Config',
	CLEAR_CACHE = '🗑️ Clear Cache',
	SHOW_DOCUMENTATION = '📖 Open Documentation',
	UPDATE = '⏫ Update Script',
}

async function runInteractive() {
	const actions = Object.values(ScriptActions).filter((item) => {
		return isNaN(Number(item))
	})

	const input = await selectOption(actions, {
		title: 'What do you want to do?',
	})

	switch (input) {
		case ScriptActions.VIEW:
			const widget = await setupAndCreateWidget()
			switch (PREVIEW_WIDGET_SIZE) {
				case 'small':
					widget.presentSmall()
					break
				case 'medium':
					widget.presentMedium()
					break
				case 'large':
					widget.presentLarge()
					break
			}
			break
		case ScriptActions.CHANGE_CREDENTIALS:
			await writeKeychain()
			break
		case ScriptActions.EDIT_CONFIG:
			await openSettings()
			break
		case ScriptActions.CLEAR_CACHE:
			clearCache()
			break
		case ScriptActions.SHOW_DOCUMENTATION:
			Safari.openInApp('https://github.com/JFK-05/scriptable-untis#readme')
			break
		case ScriptActions.UPDATE:
			await checkForUpdates(GITHUB_USER, GITHUB_REPO, GITHUB_SCRIPT_NAME, API_KEY)
			break
		default:
			console.log('No action selected, exiting script.')
			break
	}
}

try {
	if (config.runsInWidget) {
		const widget = await setupAndCreateWidget()
		Script.setWidget(widget)
	} else {
		await runInteractive()
	}
} catch (error) {
	// throw the error if it runs in the app
	if (config.runsInApp) {
		throw error
	}

	let widget: ListWidget
	const castedError = error as Error

	// try to find a matching error from the known scriptable errors
	const scriptableError = SCRIPTABLE_ERROR_MAP[castedError.message.toLowerCase()]

	// treat the error as a scriptable error if it is one, or as an extended error otherwise
	if (scriptableError) {
		widget = createErrorWidget(scriptableError.title, scriptableError.description, scriptableError.icon)
	} else {
		const extendedError = error as ExtendedError
		widget = createErrorWidget(extendedError.name, extendedError.message, extendedError.icon)
	}

	if (!config.runsInWidget) {
		widget.presentLarge()
	} else {
		Script.setWidget(widget)
	}
}

console.log(`Script finished in ${new Date().getTime() - SCRIPT_START_DATETIME.getTime()}ms.`)

Script.complete()
