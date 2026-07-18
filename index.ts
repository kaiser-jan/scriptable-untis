import { prepareUser } from '@/api/cache'
import { PREVIEW_WIDGET_SIZE, SCRIPT_START_DATETIME, UPDATE_INTERVAL, setCurrentDatetime } from '@/constants'
import { getLayout } from '@/layout'
import { openSettings } from '@/settings/editor/settingsEditor'
import { Settings } from '@/settings/settings'
import { handleError } from '@/utils/errors'
import { getModuleFileManager as getFileManagerOptions, readConfig } from '@/utils/scriptable/fileSystem'
import { selectOption } from '@/utils/scriptable/input'
import { KeychainManager } from '@/utils/scriptable/keychainManager'
import { checkForUpdates, shouldCheckForUpdates } from '@/utils/updater'
import { createWidget } from '@/widget'

// TODO: clean up this file so the controlflow is easier to read

// initialize the keychain manager
new KeychainManager('untis')

let widgetConfig: Settings | null = null

// try reading the widgetConfig to get the auto-update setting
try {
	const { useICloud } = getFileManagerOptions()
	widgetConfig = await readConfig(useICloud)
} catch (error) {}

// check for updates (in a try-catch block to prevent the script from crashing if the update fails)
try {
	if (shouldCheckForUpdates(widgetConfig, UPDATE_INTERVAL)) {
		await checkForUpdates()
	}
} catch (error) {
	console.error('⏫❌ Could not check for updates.')
	log(error)
}

async function setupAndCreateWidget() {
	const { useICloud, fileManager } = getFileManagerOptions()
	const widgetConfig = await readConfig(useICloud)

	// update the overriding current date time
	const customDatetime = new Date(widgetConfig.debugSettings.customDatetime)
	if (customDatetime && !isNaN(customDatetime.getTime())) {
		setCurrentDatetime(customDatetime)
	}

	const user = await prepareUser(widgetConfig)
	const widget = await createWidget(user, getLayout(), widgetConfig)

	return widget
}

async function presentWidget() {
    // Ask the user which widget size to preview
    const alert = new Alert();
    alert.title = "Widget Preview Size";
    alert.message = "Select which widget size you want to preview:";
    alert.addAction("📱 Small");
    alert.addAction("🖥️ Medium");
    alert.addAction("🧩 Large");
    alert.addCancelAction("Cancel");

    const response = await alert.presentAlert();
    if (response === -1) {
        console.log("Preview cancelled — no widget shown.");
        return;
    }

    const sizeMap = ["small", "medium", "large"];
    const chosenSize = sizeMap[response];

    config.widgetFamily = chosenSize;
    console.log(`📱 Previewing as ${chosenSize} widget`);

    const widget = await setupAndCreateWidget();

    // Present the widget in the chosen size
    switch (chosenSize) {
        case "small":
            await widget.presentSmall();
            break;
        case "medium":
            await widget.presentMedium();
            break;
        case "large":
            await widget.presentLarge();
            break;
    }
}

function showDocumentation() {
	console.log('📖 Opening documentation in Safari.')
	Safari.openInApp('https://github.com/kaiser-jan/scriptable-untis#readme')
}

enum ScriptActions {
	VIEW = '💻 Show Widget',
	OPEN_SETTINGS = '⚙️ Open Settings',
	// CHANGE_CREDENTIALS = '🔑 Change Credentials',
	// UPDATE = '⏫ Update Script',
	// CLEAR_CACHE = '🗑️ Clear Cache',
	SHOW_DOCUMENTATION = '📖 Open Documentation',
}

const actionMap: Record<ScriptActions, Function> = {
	[ScriptActions.VIEW]: presentWidget,
	// [ScriptActions.CHANGE_CREDENTIALS]: fillLoginDataInKeychain,
	[ScriptActions.OPEN_SETTINGS]: openSettings,
	// [ScriptActions.CLEAR_CACHE]: clearCache,
	[ScriptActions.SHOW_DOCUMENTATION]: showDocumentation,
	// [ScriptActions.UPDATE]: checkForUpdates,
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
	const currentVersion = KeychainManager.get('currentVersion')
	console.log(`Starting kaiser-jan/scriptable-untis version ${currentVersion}...`)
} catch (error) {}

try {
	if (config.runsInWidget) {
		const widget = await setupAndCreateWidget()
		Script.setWidget(widget)
	} else {
		await runInteractive()
	}
} catch (error) {
	handleError(error)
}

console.log(`Script finished in ${new Date().getTime() - SCRIPT_START_DATETIME.getTime()}ms.`)

Script.complete()
