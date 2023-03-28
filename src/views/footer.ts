import { SCRIPT_START_DATETIME } from "@/constants"
import { colors } from "@/settings/colors"
import { Settings } from "@/settings/defaultConfig"
import { addSymbol } from "@/utils/scriptable/componentHelper"
import { getCharHeight } from "@/utils/helper"

export function getFooterHeight(widgetConfig: Settings) {
	return getCharHeight(10) + 2 * 4
}
export function addFooter(container: WidgetStack | ListWidget, width: number, widgetConfig: Settings) {
	const footerGroup = container.addStack()

	footerGroup.layoutHorizontally()
	footerGroup.spacing = 4
	footerGroup.bottomAlignContent()
	footerGroup.centerAlignContent()
	// avoid overflow when pushed to the bottom
	footerGroup.setPadding(4, 6, 4, 6)
	footerGroup.size = new Size(width, getFooterHeight(widgetConfig))

	// TODO: remove
	const usingOldCache = false

	addSymbol('arrow.clockwise', footerGroup, {
		color: usingOldCache ? colors.text.red : colors.text.secondary,
		size: 10,
		outerSize: 10,
	})

	// show the time of the last update (now) as HH:MM with leading zeros
	const updateDateTime = footerGroup.addText(
		`${new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}`
	)
	updateDateTime.textColor = usingOldCache ? colors.text.red : colors.text.secondary
	updateDateTime.font = Font.regularSystemFont(10)

	if (usingOldCache) {
		const updateInfo = footerGroup.addText(' (cache)')
		updateInfo.textColor = colors.text.red
		updateInfo.font = Font.regularSystemFont(10)
	}

	footerGroup.addSpacer()

	// TODO: make more exact
	const executionDuration = `${new Date().getTime() - SCRIPT_START_DATETIME.getTime()}ms`
	const executionDurationText = footerGroup.addText(executionDuration)
	executionDurationText.textColor = colors.text.secondary
	executionDurationText.font = Font.regularSystemFont(10)
}
