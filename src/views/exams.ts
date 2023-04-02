import { CURRENT_DATETIME, LOCALE } from '@/constants'
import { colors } from '@/settings/colors'
import { TransformedExam } from '@/types/transformed'
import { getCharHeight, getCharWidth } from '@/utils/helper'
import { FlowLayoutRow } from '@/utils/scriptable/layoutHelper'
import { ViewBuildData } from '@/widget'

export function addViewExams(
	exams: TransformedExam[],
	maxCount: number,
	{ container, width, height, widgetConfig }: ViewBuildData
) {
	let remainingHeight = height
	const charHeight = getCharHeight(widgetConfig.appearance.fontSize)
	const charWidth = getCharWidth(widgetConfig.appearance.fontSize)
	const padding = 4

	if (height < charHeight + 2 * padding) return 0

	const sortedExams = exams.sort((a, b) => a.from.getTime() - b.from.getTime())

	// the minimum width of an exam: padding + icon + subject + type + date
	let minimumWidth = 2 * padding + charHeight + getCharWidth(widgetConfig.appearance.fontSize) * (6 + 5 + 6)

	// show the exam type if it fits
	let useExamType = false
	if (minimumWidth <= width) {
		useExamType = true
	}
	// show the long subject name if it fits (4 more characters)
	let useLongSubjectName = false
	if (width > minimumWidth + 4 * charWidth) {
		minimumWidth += 4 * charWidth
		useLongSubjectName = true
	}
	// show the weekday if it fits (4 more characters)
	let useWeekday = false
	if (width > minimumWidth + 4 * charWidth) {
		minimumWidth += 4 * charWidth
		useWeekday = true
	}

	let lessonCount = 0

	// add the remaining lessons until the max item count is reached
	for (let i = 0; i < sortedExams.length; i++) {
		const exam = sortedExams[i]

		// continue if the exam has already passed
		if (exam.to < CURRENT_DATETIME) continue

		// continue is not in the scope
		const secondsUntilExam = Math.floor((exam.from.getTime() - CURRENT_DATETIME.getTime()) / 1000)

		if (widgetConfig.views.exams.scope && secondsUntilExam > widgetConfig.views.exams.scope) continue

		// subtract the spacing between the items
		if (i > 0) remainingHeight -= widgetConfig.appearance.spacing

		const examContainer = container.addStack()
		examContainer.layoutHorizontally()
		examContainer.spacing = widgetConfig.appearance.spacing
		examContainer.backgroundColor = colors.background.primary
		examContainer.cornerRadius = widgetConfig.appearance.cornerRadius

		const flowLayoutRow = new FlowLayoutRow(
			width,
			remainingHeight,
			widgetConfig.appearance.spacing,
			padding,
			examContainer
		)

		flowLayoutRow.addIcon('book.circle', widgetConfig.appearance.fontSize, colors.text.secondary)

		let customOption = widgetConfig.subjects[exam.subject]
		if (customOption && !Array.isArray(customOption)) {
			exam.subject = customOption.nameOverride ?? exam.subject
			if (useLongSubjectName && customOption.longNameOverride) {
				exam.subject = customOption.longNameOverride
			}
		}

		flowLayoutRow.addText(
			exam.subject,
			Font.mediumSystemFont(widgetConfig.appearance.fontSize),
			widgetConfig.appearance.fontSize,
			colors.text.primary
		)

		if (useExamType) {
			flowLayoutRow.addText(
				exam.type,
				Font.mediumSystemFont(widgetConfig.appearance.fontSize),
				widgetConfig.appearance.fontSize,
				colors.text.secondary
			)
		}

		let dateFormat: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
		if (useWeekday) dateFormat.weekday = 'short'
		const date = exam.from.toLocaleString(LOCALE, dateFormat)
		flowLayoutRow.addText(
			date,
			Font.regularSystemFont(widgetConfig.appearance.fontSize),
			widgetConfig.appearance.fontSize,
			colors.text.primary
		)

		const { resultingWidth, resultingHeight } = flowLayoutRow.finish()

		remainingHeight -= resultingHeight
		lessonCount++

		// exit if the max item count is reached
		if (maxCount && lessonCount >= maxCount) break

		// exit if it would get too big, use the maximum height
		if (remainingHeight - 3 * charHeight + 2 * widgetConfig.appearance.spacing < 0) break
	}

	return height - remainingHeight
}
