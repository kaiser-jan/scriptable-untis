import { MAX_LONG_SUBJECT_NAME_LENGTH, MAX_SUBJECT_NAME_LENGTH, MAX_TIME_STRING } from '@/constants'
import { colors } from '@/settings/colors'
import { applySubjectConfig, getLessonConfigFor } from '@/settings/lessonConfig'
import { Settings } from '@/settings/settings'
import { LessonState } from '@/types/api'
import { TransformedLesson } from '@/types/transformed'
import { asNumericTime, getCharHeight, getCharWidth, getTextWidth } from '@/utils/helper'
import { filterCanceledLessons } from '@/utils/lessonHelper'
import { addBreak, addWidgetLesson } from '@/utils/scriptable/componentHelper'
import { ViewBuildData } from '@/widget'

export function addViewLessons(
	lessons: TransformedLesson[],
	count: number | undefined,
	{ container, width, height }: ViewBuildData,
	widgetConfig: Settings
) {
	// only allow up to x items to avoid overflow
	let itemCount = 0

	const padding = 4
	const lessonHeight = getCharHeight(widgetConfig.appearance.fontSize) + 2 * padding

	const innerSpacing = widgetConfig.appearance.spacing
	// the width including: padding, subject, spacing and icon
	const lessonWidth =
		2 * padding +
		getCharWidth(widgetConfig.appearance.fontSize) * MAX_SUBJECT_NAME_LENGTH +
		innerSpacing +
		getCharHeight(widgetConfig.appearance.fontSize)
	const timeWidth = getTextWidth(MAX_TIME_STRING, widgetConfig.appearance.fontSize) + 2 * padding
	let currentWidth = lessonWidth + widgetConfig.appearance.spacing + timeWidth

	let showToTime = false

	// check if there is space for a "to" time
	if (currentWidth + widgetConfig.appearance.spacing + timeWidth <= width) {
		showToTime = widgetConfig.views.lessons.showEndTimes
		currentWidth += widgetConfig.appearance.spacing + timeWidth
	}

	let remainingHeight = height

	let previousLesson: TransformedLesson | null = null

	// add the remaining lessons until the max item count is reached
	for (let i = 0; i < lessons.length; i++) {
		const lesson = lessons[i]

		// update the item count, even if the lesson is hidden
		itemCount++

		const subjectConfig = getLessonConfigFor(lesson, widgetConfig)
		// apply the config to the lesson
		applySubjectConfig(lesson, subjectConfig)

		// take into account the spacing between the lessons
		if (i > 0) {
			remainingHeight -= widgetConfig.appearance.spacing
		}

		// check for a break if the previous lesson exists
		if (previousLesson) {
			// if the gap between the previous lesson and this lesson is too big, add a break
			const gapDuration = lesson.from.getTime() - previousLesson.to.getTime()
			if (
				previousLesson &&
				widgetConfig.views.lessons.showLongBreaks &&
				gapDuration > widgetConfig.config.breakMax * 1000
			) {
				addBreak(container, previousLesson.to, lesson.from, showToTime, widgetConfig)
				itemCount++
				remainingHeight -= widgetConfig.appearance.spacing + lessonHeight
				if ((count && itemCount >= count) || remainingHeight < lessonHeight + widgetConfig.appearance.spacing)
					break
			}
		}

		// check if the user wants to show canceled lessons
		const isRescheduled = lesson.isRescheduled && lesson.rescheduleInfo.isSource
		const istCancelled = lesson.state === LessonState.CANCELED || lesson.state === LessonState.FREE || isRescheduled
		if (!widgetConfig.views.lessons.showCanceled && istCancelled) continue

		// only show the time if the previous lesson didn't start at the same time
		const showTime = !previousLesson || previousLesson.from.getTime() !== lesson.from.getTime()
		// if there is space for more text (longer subject name)
		const useSubjectLongName =
			currentWidth + MAX_LONG_SUBJECT_NAME_LENGTH + getCharWidth(widgetConfig.appearance.fontSize) <= width
		addWidgetLesson(lesson, container, widgetConfig, { showTime, showToTime, useSubjectLongName })

		remainingHeight -= lessonHeight

		// update the previous lesson for the next iteration
		previousLesson = lesson

		// exit if the max item count is reached
		if (count && itemCount >= count) break
		// exit if it would get too big
		if (remainingHeight < lessonHeight + widgetConfig.appearance.spacing) break
	}

	const remainingFontSize = widgetConfig.appearance.fontSize * 0.8
	// add a "+ x more" if there are more lessons and there is enough space
	if (
		lessons.length > itemCount &&
		remainingHeight > getCharHeight(remainingFontSize) + widgetConfig.appearance.spacing
	) {
		const realLessons = filterCanceledLessons(lessons.slice(itemCount - 1))
		const dayToString = asNumericTime(realLessons[realLessons.length - 1].to)
		// count the number of remaining lessons including the duration
		const lessonCount = realLessons.reduce((acc, lesson) => {
			return acc + lesson.duration
		}, 0)
		const andMoreText = container.addText(` + ${lessonCount} more, until ${dayToString}`)
		console.log(`Added label for ${lessonCount} more lessons until ${dayToString}`)
		andMoreText.font = Font.regularSystemFont(remainingFontSize)
		andMoreText.textColor = colors.text.secondary
		remainingHeight -= getCharHeight(remainingFontSize) + widgetConfig.appearance.spacing
	}

	return height - remainingHeight
}
