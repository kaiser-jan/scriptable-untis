import { clearCache, prepareUser } from '@/api/cache'
import { PREVIEW_WIDGET_SIZE, SCRIPT_START_DATETIME } from '@/constants'
import { getLayout } from '@/layout'
import { Options } from '@/preferences/config'
import { selectOption, writeKeychain } from '@/setup'
import { createErrorWidget, ExtendedError, ScriptableErrors } from '@/utils/errors'
import { getFileManagerOptions, readConfig } from '@/utils/fileSystem'
import { createWidget } from '@/widget'

async function setupAndCreateWidget() {
	const { useICloud, documentsDirectory } = getFileManagerOptions()
	const untisConfig = await readConfig(documentsDirectory, useICloud)
	const options: Options = { ...untisConfig, documentsDirectory, useICloud }
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
