import { clearCache, prepareUser } from '@/api/cache'
import { PREVIEW_WIDGET_SIZE, SCRIPT_START_DATETIME } from '@/constants'
import { getLayout } from '@/layout'
import { Options } from '@/preferences/config'
import { writeKeychain } from '@/setup'
import { createErrorWidget, ExtendedError, ScriptableErrors } from '@/utils/errors'
import { getModuleFileManager as getFileManagerOptions, readConfig } from '@/utils/scriptable/fileSystem'
import { selectOption } from '@/utils/scriptable/input'
import { createWidget } from '@/widget'

// TODO: Auto-Update
// store the last update date in the keychain
// check every day (store the last check date in the keychain)
// compare the last update date with the date from the github api

async function setupAndCreateWidget() {
	const { useICloud, fileManager } = getFileManagerOptions()
	const untisConfig = await readConfig(useICloud, fileManager)
	const options: Options = { ...untisConfig, useICloud, fileManager }
	const user = await prepareUser(options)
	const widget = await createWidget(user, getLayout(), options)
	return widget
}

enum ScriptActions {
	VIEW = '💻 Show Widget',
	CHANGE_CREDENTIALS = '🔑 Change Credentials',
	CLEAR_CACHE = '🗑️ Clear Cache',
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
		case ScriptActions.CLEAR_CACHE:
			clearCache()
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
	console.log(error)

	let widget: ListWidget
	const castedError = error as Error

	if (castedError.message.toLowerCase() == ScriptableErrors.NO_INTERNET.toLowerCase()) {
		widget = createErrorWidget('The internet connection seems to be offline!', '', 'wifi.exclamationmark')
	} else {
		const extendedError = error as ExtendedError
		console.log(extendedError.stack)
		console.log(extendedError.cause as string)
		widget = createErrorWidget(extendedError.name, extendedError.message, extendedError.icon)
	}

	if (!config.runsInWidget) {
		widget.presentLarge()
	}

	Script.setWidget(widget)
}

console.log(`Script finished in ${new Date().getTime() - SCRIPT_START_DATETIME.getTime()}ms.`)

Script.complete()
