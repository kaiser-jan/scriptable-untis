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

async function presentWidget() {
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
}

function showDocumentation() {
	console.log('📖 Opening documentation in Safari.')
	Safari.openInApp('https://github.com/JFK-05/scriptable-untis#readme')
}

enum ScriptActions {
	VIEW = '💻 Show Widget',
	OPEN_SETTINGS = '⚙️ Open Settings',
	CHANGE_CREDENTIALS = '🔑 Change Credentials',
	UPDATE = '⏫ Update Script',
	CLEAR_CACHE = '🗑️ Clear Cache',
	SHOW_DOCUMENTATION = '📖 Open Documentation',
}

const actionMap: Record<ScriptActions, Function> = {
	[ScriptActions.VIEW]: presentWidget,
	[ScriptActions.CHANGE_CREDENTIALS]: writeKeychain,
	[ScriptActions.OPEN_SETTINGS]: openSettings,
	[ScriptActions.CLEAR_CACHE]: clearCache,
	[ScriptActions.SHOW_DOCUMENTATION]: showDocumentation,
	[ScriptActions.UPDATE]: () => checkForUpdates(GITHUB_USER, GITHUB_REPO, GITHUB_SCRIPT_NAME, API_KEY),
}

async function runInteractive() {
	const actions = Object.values(ScriptActions).filter((item) => {
		return isNaN(Number(item))
	})

	const input = (await selectOption(actions, {
		title: 'What do you want to do?',
	})) as ScriptActions | null

	const action = actionMap[input]

	if (!action) {
		console.log('No action selected, exiting.')
		return
	}

	await action()
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
