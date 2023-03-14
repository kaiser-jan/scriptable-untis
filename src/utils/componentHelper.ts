import { MAX_TIME_STRING } from "@/constants";
import { getCharHeight, getTextWidth, getCharWidth, asNumericTime } from "./helper";
import { getSubjectTitle } from "./lessonHelper";
import { TransformedLesson } from "@/types/transformed";
import { Config } from "@/preferences/config";
import { LessonState } from "@/types/api";
import { colors, getColor } from "@/preferences/colors";

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
export function addBreak(to: WidgetStack | ListWidget, breakFrom: Date, breakTo: Date, showToTime: boolean, config: Config) {
	const breakContainer = makeTimelineEntry(to, breakFrom, config, {
		backgroundColor: colors.background.primary,
		showTime: true,
		showToTime: showToTime,
		toTime: breakTo,
	})
	const breakTitle = breakContainer.addText('Break')
	breakTitle.font = Font.mediumSystemFont(config.appearance.fontSize)
	breakTitle.textColor = colors.text.secondary
	breakContainer.addSpacer()
}

/**
 * Creates a "timeline entry" which is a container (you can add content to) with the time on the left.
 * @param to the container to add the entry to
 * @param time the from time of the entry
 * @param config
 * @param options additional options
 * @returns the first stack of the entry, which can be used to add content
 */
function makeTimelineEntry(
	to: WidgetStack | ListWidget,
	time: Date,
	config: Config,
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
	lessonWrapper.spacing = config.appearance.spacing

	const lessonContainer = lessonWrapper.addStack()
	lessonContainer.backgroundColor = options.backgroundColor
	lessonContainer.layoutHorizontally()
	lessonContainer.setPadding(padding, padding, padding, padding)
	lessonContainer.cornerRadius = config.appearance.cornerRadius

	if (options.showTime) {
		const timeWrapper = lessonWrapper.addStack()
		timeWrapper.backgroundColor = options.backgroundColor
		timeWrapper.setPadding(padding, padding, padding, padding)
		timeWrapper.cornerRadius = config.appearance.cornerRadius
		timeWrapper.size = new Size(
			getTextWidth(MAX_TIME_STRING, config.appearance.fontSize) + 2 * padding,
			getCharHeight(config.appearance.fontSize) + 2 * padding
		)

		const timeText = timeWrapper.addDate(new Date(time))
		timeText.font = Font.mediumSystemFont(config.appearance.fontSize)
		timeText.textColor = colors.text.primary
		timeText.rightAlignText()
		timeText.applyTimeStyle()

		if (options.showToTime) {
			const timeToWrapper = lessonWrapper.addStack()
			timeToWrapper.backgroundColor = options.backgroundColor
			timeToWrapper.setPadding(padding, padding, padding, padding)
			timeToWrapper.cornerRadius = config.appearance.cornerRadius
			timeToWrapper.size = new Size(
				getTextWidth(MAX_TIME_STRING, config.appearance.fontSize) + 2 * padding,
				getCharHeight(config.appearance.fontSize) + 2 * padding
			)

			const timeToText = timeToWrapper.addDate(new Date(options.toTime))
			timeToText.font = Font.mediumSystemFont(config.appearance.fontSize)
			timeToText.textColor = colors.text.primary
			timeToText.rightAlignText()
			timeToText.applyTimeStyle()
		}
	}

	return lessonContainer
}

/**
 * Adds a lesson to the widget. This includes its subject, additional info (as an icon) and the time.
 * The state is also shown as through colors. (canceled, event)
 * @param lesson the lesson to add
 * @param to the container to add the lesson to
 * @param config
 * @param options
 */
export function addWidgetLesson(
	lesson: TransformedLesson,
	to: ListWidget | WidgetStack,
	config: Config,
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
	const isCanceled = lesson.state === LessonState.CANCELED
	const isCanceledOrFree = isCanceled || lesson.state === LessonState.FREE
	const isRescheduled = lesson.state === LessonState.RESCHEDULED && lesson.rescheduleInfo?.isSource

	// define the colors
	let backgroundColor = getColor(lesson.backgroundColor)
	let textColor = colors.text.primary
	let iconColor: Color = colors.text.secondary

	// adjust the colors for canceled lessons and similar
	if (lesson.state === LessonState.CANCELED || lesson.state === LessonState.FREE || isRescheduled) {
		backgroundColor = colors.background.primary
		textColor = colors.text.disabled
		iconColor = colors.text.disabled
	}

	// consider breaks during the combined lesson
	let toTime = lesson.to
	if (config.views.lessons.skipShortBreaks && lesson.break) {
		toTime = new Date(lesson.to.getTime() - lesson.break)
	}

	// add the entry with the time
	const lessonContainer = makeTimelineEntry(to, lesson.from, config, {
		showTime: options.showTime,
		showToTime: options.showToTime,
		toTime: toTime,
		backgroundColor: backgroundColor,
	})
	lessonContainer.spacing = config.appearance.spacing

	// add the name of the subject
	const lessonText = lessonContainer.addText(getSubjectTitle(lesson, options.useSubjectLongName))
	lessonText.font = Font.semiboldSystemFont(config.appearance.fontSize)
	lessonText.textColor = textColor
	lessonText.leftAlignText()
	lessonText.lineLimit = 1

	// add a x2 for double lessons etc.
	if (lesson.duration > 1) {
		const durationText = lessonContainer.addText(`x${lesson.duration}`)
		durationText.font = Font.mediumSystemFont(config.appearance.fontSize)
		durationText.textColor = isCanceled ? colors.text.disabled : colors.text.secondary
	}

	let iconName: string | undefined = undefined

	// add icons for the lesson state
	if (lesson.isEvent) {
		iconName = 'calendar.circle'
	} else if (isCanceledOrFree && !lesson.isRescheduled) {
		iconName = 'xmark.circle'
		if (isCanceled) iconColor = colors.text.red
	} else if (lesson.state === LessonState.ADDITIONAL) {
		iconName = 'plus.circle'
	} else if (lesson.state === LessonState.RESCHEDULED) {
		iconName = 'calendar.circle'
	} else if (lesson.state === LessonState.EXAM) {
		iconName = 'book.circle'
	} else if (lesson.state === LessonState.SUBSTITUTED) {
		iconName = 'person.circle'
	} else if (lesson.state === LessonState.ROOM_SUBSTITUTED) {
		iconName = 'location.circle'
	} else if (lesson.state === LessonState.FREE) {
		iconName = 'bell.circle'
	} else if (lesson.text || lesson.info || lesson.note) {
		iconName = 'info.circle'
	}

	if (!iconName) {
		lessonContainer.addSpacer()
	}

	if (lesson.isRescheduled && lesson.rescheduleInfo?.isSource) {
		const iconShift = addSymbol('arrow.right', lessonContainer, {
			color: isCanceled ? colors.text.disabled : colors.text.secondary,
			size: config.appearance.fontSize * 0.8,
		})
		// manually correct the arrow box
		iconShift.imageSize = new Size(
			getCharWidth(config.appearance.fontSize * 0.8),
			getCharHeight(config.appearance.fontSize)
		)
		// display the time it was rescheduled to
		// const rescheduledTimeWrapper = lessonContainer.addStack()
		const rescheduledTime = lessonContainer.addText(asNumericTime(lesson.rescheduleInfo?.otherFrom))
		rescheduledTime.font = Font.mediumSystemFont(config.appearance.fontSize)
		rescheduledTime.textColor = isCanceled ? colors.text.disabled : colors.text.secondary
	}

	if (iconName) {
		// TODO: this does not work properly (min width?) - e.g. 2022-09-19
		lessonContainer.addSpacer()
		addSymbol(iconName, lessonContainer, { color: iconColor, size: config.appearance.fontSize })
	}
}

/**
 * Fills/transforms the given container with the given lesson information.
 * @param lesson
 * @param container
 * @param config
 */
export function fillContainerWithSubject(lesson: TransformedLesson, container: WidgetStack, config: Config) {
	let backgroundColor = getColor(lesson.backgroundColor)
	let textColor = colors.text.primary

	// apply the colors for canceled lessons and similar
	if (lesson.state === LessonState.CANCELED) {
		backgroundColor = colors.background.primary
		textColor = colors.text.red
	} else if (lesson.state === LessonState.FREE) {
		backgroundColor = colors.background.primary
		textColor = colors.text.disabled
	} else if (lesson.state === LessonState.RESCHEDULED) {
		// only show as primary if it is not the source -> it is the one that takes place
		if (lesson.rescheduleInfo?.isSource) {
			backgroundColor = colors.background.primary
			textColor = colors.text.disabled
		} else {
			backgroundColor = colors.background.primary
			textColor = colors.text.primary
		}
	} else if (lesson.isEvent) {
		backgroundColor = colors.background.primary
		textColor = colors.text.event
	}

	container.backgroundColor = backgroundColor
	container.layoutHorizontally()
	container.setPadding(4, 4, 4, 4)
	container.cornerRadius = config.appearance.cornerRadius
	container.spacing = config.appearance.spacing

	// add the name of the subject
	const subjectText = container.addText(getSubjectTitle(lesson))
	subjectText.font = Font.mediumSystemFont(config.appearance.fontSize)
	subjectText.textColor = textColor
	subjectText.leftAlignText()
	subjectText.minimumScaleFactor = 1
	subjectText.lineLimit = 1

	// add a x2 for double lessons etc.
	if (config.summary.showMultiplier && lesson.duration > 1) {
		const durationText = container.addText(`x${lesson.duration}`)
		durationText.font = Font.mediumSystemFont(config.appearance.fontSize)
		durationText.textColor = colors.text.secondary
	}
}
