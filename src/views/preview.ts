import { CURRENT_DATETIME } from "@/constants"
import { combineLessons } from "@/api/transformLessons"
import { LOCALE } from "@/constants"
import { Settings } from "@/settings/settings"
import { TransformedLesson } from "@/types/transformed"
import { fillContainerWithSubject } from "@/utils/scriptable/componentHelper"
import { getCharHeight, getCharWidth, asNumericTime, getTextWidth } from "@/utils/helper"
import { FlowLayoutRow } from "@/utils/scriptable/layoutHelper"
import { filterCanceledLessons, getSubjectTitle } from "@/utils/lessonHelper"
import { ViewBuildData } from "@/widget"
import { LessonState } from "@/types/api"
import { colors } from "@/settings/colors"

export function addViewPreview(
	lessons: TransformedLesson[],
	nextDayKey: string,
	{ container, width, height, widgetConfig }: ViewBuildData,
) {
	const titleHeight = getCharHeight(widgetConfig.appearance.fontSize)
	const subjectHeight = getCharHeight(widgetConfig.appearance.fontSize) + 8
	let currentHeight = 0

	// if the next lesson is more than 3 days away, don't show the preview
	if (lessons[0].from.getTime() > CURRENT_DATETIME.getTime() + 3 * 24 * 60 * 60 * 1000) {
		console.log('Not showing preview because the next lesson is more than 3 days away')
		const padding = 4
		const containerHeight = 2 * getCharHeight(widgetConfig.appearance.fontSize) + 2 * padding

		const messageContainer = container.addStack()
		messageContainer.layoutHorizontally()
		messageContainer.setPadding(padding, padding, padding, padding)
		messageContainer.spacing = widgetConfig.appearance.spacing
		messageContainer.backgroundColor = colors.background.primary
		messageContainer.cornerRadius = widgetConfig.appearance.cornerRadius
		messageContainer.size = new Size(width, containerHeight)

		const text = messageContainer.addText('No lessons in the next 3 days! 🥳')
		text.textColor = colors.text.event
		text.font = Font.semiboldRoundedSystemFont(widgetConfig.appearance.fontSize)
		text.leftAlignText()

		messageContainer.addSpacer()

		return containerHeight
	}

	// add information about the next day if there is enough space
	if (lessons && height > titleHeight) {
		addPreviewTitle(container, lessons, nextDayKey, width, widgetConfig)
		currentHeight += titleHeight + widgetConfig.appearance.spacing

		// TODO: might cause overflow, as the height is not checked
		if (height - currentHeight > subjectHeight) {
			currentHeight +=
				addPreviewList(container, lessons, widgetConfig, width, height - currentHeight).resultingHeight +
				widgetConfig.appearance.spacing
		}
	}
	return currentHeight
}

/**
 * Adds a title for the preview containing the weekday,
 * and from when to when the lessons take place ignoring canceled lessons.
 */
function addPreviewTitle(
	container: ListWidget | WidgetStack,
	lessons: TransformedLesson[],
	nextDayKey: string,
	width: number,
	widgetConfig: Settings
) {
	const nextDayHeader = container.addStack()
	nextDayHeader.layoutHorizontally()
	nextDayHeader.spacing = 4
	nextDayHeader.bottomAlignContent()

	// get the weekday string
	const useLongName = width > 22 * getCharWidth(widgetConfig.appearance.fontSize)
	const weekdayFormat = useLongName ? 'long' : 'short'
	const title = nextDayHeader.addText(
		new Date(nextDayKey).toLocaleDateString(LOCALE, { weekday: weekdayFormat }) + ':'
	)
	title.font = Font.semiboldSystemFont(widgetConfig.appearance.fontSize)
	title.textColor = colors.text.primary
	title.lineLimit = 1

	nextDayHeader.addSpacer()

	// show from when to when the next day takes place
	const realLessons = filterCanceledLessons(lessons)
	const dayFromString = asNumericTime(realLessons[0].from)
	const dayToString = asNumericTime(realLessons[realLessons.length - 1].to)

	const fromToText = nextDayHeader.addText(`${dayFromString} - ${dayToString}`)
	fromToText.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
	fromToText.textColor = colors.text.primary
}

/**
 * Adds a list of subjects of the given day to the widget.
 */
function addPreviewList(
	container: WidgetStack,
	lessons: TransformedLesson[],
	widgetConfig: Settings,
	width: number,
	height: number
) {
	// combine lessons if they have the same subject and are after each other
	const combinedLessonsNextDay = combineLessons(lessons, widgetConfig, true, true)

	const spacing = 4

	// add a container for the list of subjects
	const subjectListContainer = container.addStack()
	subjectListContainer.layoutVertically()
	subjectListContainer.spacing = spacing

	const padding = 4

	const flowLayoutRow = new FlowLayoutRow(width, height, widgetConfig.appearance.spacing, 0, subjectListContainer)

	for (const lesson of combinedLessonsNextDay) {
		// skip the subject if it is 'free'
		if (lesson.state === LessonState.FREE) continue

		let subjectWidth = getTextWidth(getSubjectTitle(lesson), widgetConfig.appearance.fontSize) + 2 * padding
		if (widgetConfig.views.lessons.showMultiplier && lesson.duration > 1) {
			subjectWidth += getTextWidth('x2', widgetConfig.appearance.fontSize) + spacing
		}

		const subjectContainer = flowLayoutRow.addContainer(
			subjectWidth,
			getCharHeight(widgetConfig.appearance.fontSize) + 8,
			true
		)

		if (subjectContainer) {
			fillContainerWithSubject(lesson, subjectContainer, widgetConfig)
		}
	}

	return flowLayoutRow.finish()
}
