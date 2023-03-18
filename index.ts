import { clearCache, prepareUser } from '@/api/cache'
import { PREVIEW_WIDGET_SIZE, SCRIPT_START_DATETIME } from '@/constants'
import { getLayout } from '@/layout'
import { openConfigEditor } from '@/preferences/configEditor'
import { writeKeychain } from '@/setup'
import { createErrorWidget, ExtendedError, SCRIPTABLE_ERROR_MAP } from '@/utils/errors'
import { getModuleFileManager as getFileManagerOptions, readConfig } from '@/utils/scriptable/fileSystem'
import { selectOption } from '@/utils/scriptable/input'
import { createWidget } from '@/widget'

// TODO: Auto-Update
// store the last update date in the keychain
// check every day (store the last check date in the keychain)
// compare the last update date with the date from the github api

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
			await openConfigEditor()
			break
		case ScriptActions.CLEAR_CACHE:
			clearCache()
			break
		case ScriptActions.SHOW_DOCUMENTATION:
			Safari.openInApp('https://github.com/JFK-05/scriptable-untis#readme')
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

	const scriptableError = SCRIPTABLE_ERROR_MAP[castedError.message.toLowerCase()]
	log(scriptableError)
	if (scriptableError) {
		widget = createErrorWidget(scriptableError.title, scriptableError.description, scriptableError.icon)
	} else {
		const extendedError = error as ExtendedError
		widget = createErrorWidget(extendedError.name, extendedError.message, extendedError.icon)
	}

	if (!config.runsInWidget) {
		widget.presentLarge()
	}

	Script.setWidget(widget)
}

console.log(`Script finished in ${new Date().getTime() - SCRIPT_START_DATETIME.getTime()}ms.`)

Script.complete()
