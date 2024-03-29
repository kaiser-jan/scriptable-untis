import { MAX_TIME_STRING } from '@/constants'
import { colors, getColor } from '@/settings/colors'
import { Settings } from '@/settings/settings'
import { LessonState } from '@/types/api'
import { TransformedLesson } from '@/types/transformed'
import { asNumericTime, getCharHeight, getCharWidth, getTextWidth } from '../helper'
import { getSubjectTitle } from '../lessonHelper'

/**
 * Adds a SFSymbol with the correct outer size to match the font size.
 */
export function addSymbol(
	name: string,
	to: WidgetStack | ListWidget,
	options: { color: Color; size: number; outerSize?: number }
) {
	const icon = SFSymbol.named(name)
	icon.applyFont(Font.mediumSystemFont(options.size))
	const iconImage = to.addImage(icon.image)
	const outerSize = options.outerSize ?? getCharHeight(options.size)
	iconImage.imageSize = new Size(outerSize, outerSize)
	iconImage.resizable = false
	iconImage.tintColor = options.color
	return iconImage
}

/**
 * Adds a break to the widget.
 */
export function addBreak(
	to: WidgetStack | ListWidget,
	breakFrom: Date,
	breakTo: Date,
	showToTime: boolean,
	widgetConfig: Settings
) {
	const breakContainer = makeTimelineEntry(to, breakFrom, widgetConfig, {
		backgroundColor: colors.background.primary,
		showTime: true,
		showToTime: showToTime,
		toTime: breakTo,
	})
	const breakTitle = breakContainer.addText('Break')
	breakTitle.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
	breakTitle.textColor = colors.text.secondary
	breakContainer.addSpacer()
}

/**
 * Creates a "timeline entry" which is a container (you can add content to) with the time on the left.
 * @param to the container to add the entry to
 * @param time the from time of the entry
 * @param widgetConfig
 * @param options additional widgetConfig
 * @returns the first stack of the entry, which can be used to add content
 */
function makeTimelineEntry(
	to: WidgetStack | ListWidget,
	time: Date,
	widgetConfig: Settings,
	options: {
		showTime?: boolean
		showToTime?: boolean
		toTime?: Date
		backgroundColor?: Color
	} = { showTime: true }
) {
	const padding = 4

	const lessonWrapper = to.addStack()
	lessonWrapper.layoutHorizontally()
	lessonWrapper.spacing = widgetConfig.appearance.spacing

	const lessonContainer = lessonWrapper.addStack()
	lessonContainer.backgroundColor = options.backgroundColor
	lessonContainer.layoutHorizontally()
	lessonContainer.setPadding(padding, padding, padding, padding)
	lessonContainer.cornerRadius = widgetConfig.appearance.cornerRadius

	if (options.showTime) {
		const timeWrapper = lessonWrapper.addStack()
		timeWrapper.backgroundColor = options.backgroundColor
		timeWrapper.setPadding(padding, padding, padding, padding)
		timeWrapper.cornerRadius = widgetConfig.appearance.cornerRadius
		timeWrapper.size = new Size(
			getTextWidth(MAX_TIME_STRING, widgetConfig.appearance.fontSize) + 2 * padding,
			getCharHeight(widgetConfig.appearance.fontSize) + 2 * padding
		)

		const timeText = timeWrapper.addDate(new Date(time))
		timeText.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
		timeText.textColor = colors.text.primary
		timeText.rightAlignText()
		timeText.applyTimeStyle()

		if (options.showToTime) {
			const timeToWrapper = lessonWrapper.addStack()
			timeToWrapper.backgroundColor = options.backgroundColor
			timeToWrapper.setPadding(padding, padding, padding, padding)
			timeToWrapper.cornerRadius = widgetConfig.appearance.cornerRadius
			timeToWrapper.size = new Size(
				getTextWidth(MAX_TIME_STRING, widgetConfig.appearance.fontSize) + 2 * padding,
				getCharHeight(widgetConfig.appearance.fontSize) + 2 * padding
			)

			const timeToText = timeToWrapper.addDate(new Date(options.toTime))
			timeToText.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
			timeToText.textColor = colors.text.primary
			timeToText.rightAlignText()
			timeToText.applyTimeStyle()
		}
	}

	return lessonContainer
}

function getLessonColors(lesson: TransformedLesson) {
	/** Whether the lesson was rescheduled away from here. (isSource)
	 * The lesson state seems to be CANCELED? */
	const isRescheduledAway = lesson.rescheduleInfo?.isSource

	// define the colors
	let backgroundColor = getColor(lesson.backgroundColor)
	let textColor = colors.text.primary
	let secondaryTextColor = colors.text.secondary

	if (lesson.state === LessonState.FREE || isRescheduledAway) {
		backgroundColor = colors.background.primary
		textColor = colors.text.disabled
		secondaryTextColor = colors.text.disabled
	}
	// only make it red if it's canceled
	else if (lesson.state === LessonState.CANCELED) {
		backgroundColor = colors.background.primary
		textColor = colors.text.red
		secondaryTextColor = colors.text.red
	}

	return { backgroundColor, textColor, secondaryTextColor }
}

/**
 * Adds a lesson to the widget. This includes its subject, additional info (as an icon) and the time.
 * The state is also shown as through colors. (canceled, event)
 * @param lesson the lesson to add
 * @param to the container to add the lesson to
 * @param widgetConfig
 * @param options
 */
export function addWidgetLesson(
	lesson: TransformedLesson,
	to: ListWidget | WidgetStack,
	widgetConfig: Settings,
	options: {
		showTime: boolean
		showToTime: boolean
		useSubjectLongName: boolean
	} = {
		showTime: true,
		showToTime: false,
		useSubjectLongName: false,
	}
) {
	// get the colors for the lesson based on its state (red, disabled, normal)
	const { backgroundColor, textColor, secondaryTextColor } = getLessonColors(lesson)

	// consider breaks during the combined lesson
	let toTime = lesson.to
	if (widgetConfig.views.lessons.skipShortBreaks && lesson.break) {
		toTime = new Date(lesson.to.getTime() - lesson.break)
	}

	// add the entry with the time
	const lessonContainer = makeTimelineEntry(to, lesson.from, widgetConfig, {
		showTime: options.showTime,
		showToTime: options.showToTime,
		toTime: toTime,
		backgroundColor: backgroundColor,
	})
	lessonContainer.spacing = widgetConfig.appearance.spacing

	// add the name of the subject
	const lessonText = lessonContainer.addText(getSubjectTitle(lesson, options.useSubjectLongName))
	lessonText.font = Font.semiboldSystemFont(widgetConfig.appearance.fontSize)
	lessonText.textColor = textColor
	lessonText.leftAlignText()

	// add a x2 for double lessons etc.
	if (lesson.duration > 1 && widgetConfig.views.lessons.showMultiplier) {
		const durationText = lessonContainer.addText(`x${lesson.duration}`)
		durationText.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
		durationText.textColor = secondaryTextColor
	}

	let iconName: string | undefined = undefined

	// TODO: consider adding another icon for rescheduled source lessons, as they have state canceled
	const STATE_ICON_MAP: Record<LessonState, string> = {
		[LessonState.NORMAL]: undefined,
		[LessonState.CANCELED]: 'xmark.circle',
		[LessonState.FREE]: 'xmark.circle',
		[LessonState.ADDITIONAL]: 'plus.circle',
		[LessonState.RESCHEDULED]: 'calendar.circle',
		[LessonState.EXAM]: 'book.circle',
		[LessonState.SUBSTITUTED]: 'person.circle',
		[LessonState.TEACHER_SUBSTITUTED]: 'person.circle',
		[LessonState.ROOM_SUBSTITUTED]: 'location.circle',
	}

	// add icons for the lesson state
	if (lesson.isEvent) {
		iconName = 'calendar.circle'
	} else if (lesson.rescheduleInfo?.isSource) {
		// do not add an icon, as the lesson already has the reschedule info
	} else if (STATE_ICON_MAP[lesson.state]) {
		iconName = STATE_ICON_MAP[lesson.state]
	} else if (lesson.text || lesson.info || lesson.note) {
		iconName = 'info.circle'
	}

	if (!iconName) {
		lessonContainer.addSpacer()
	}

	// add a shift info if the lesson was rescheduled
	if (lesson.isRescheduled && lesson.rescheduleInfo?.isSource) {
		const iconShift = addSymbol('arrow.right', lessonContainer, {
			color: colors.text.disabled,
			size: widgetConfig.appearance.fontSize * 0.8,
		})
		// manually correct the arrow box
		iconShift.imageSize = new Size(
			getCharWidth(widgetConfig.appearance.fontSize * 0.8),
			getCharHeight(widgetConfig.appearance.fontSize)
		)

		// display the time it was rescheduled to
		const rescheduledTime = lessonContainer.addText(asNumericTime(lesson.rescheduleInfo?.otherFrom))
		rescheduledTime.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
		rescheduledTime.textColor = colors.text.disabled
	}

	if (iconName) {
		lessonContainer.addSpacer()
		addSymbol(iconName, lessonContainer, { color: secondaryTextColor, size: widgetConfig.appearance.fontSize })
	}
}

/**
 * Fills/transforms the given container with the given lesson information.
 * @param lesson
 * @param container
 * @param widgetConfig
 */
export function fillContainerWithSubject(lesson: TransformedLesson, container: WidgetStack, widgetConfig: Settings) {
	const { backgroundColor, textColor, secondaryTextColor } = getLessonColors(lesson)

	container.backgroundColor = backgroundColor
	container.layoutHorizontally()
	container.setPadding(4, 4, 4, 4)
	container.cornerRadius = widgetConfig.appearance.cornerRadius
	container.spacing = widgetConfig.appearance.spacing

	// add the name of the subject
	const subjectText = container.addText(getSubjectTitle(lesson))
	subjectText.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
	subjectText.textColor = textColor
	subjectText.leftAlignText()
	subjectText.minimumScaleFactor = 1
	subjectText.lineLimit = 1

	// add a x2 for double lessons etc.
	if (widgetConfig.views.lessons.showMultiplier && lesson.duration > 1) {
		const durationText = container.addText(`x${lesson.duration}`)
		durationText.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
		durationText.textColor = colors.text.secondary
	}
}
