import { CURRENT_DATETIME, LOCALE } from '@/constants'
import { colors, getColor } from '@/settings/colors'
import { SubjectConfig, TeacherSpecificSubjectConfig } from '@/types/settings'
import { TransformedExam } from '@/types/transformed'
import { getCharHeight, getCharWidth, getTextWidth } from '@/utils/helper'
import { FlowLayoutRow } from '@/utils/scriptable/layout/flowLayoutRow'
import { StaticLayoutRow } from '@/utils/scriptable/layout/staticLayoutRow'
import { ViewBuildData } from '@/widget'

export function addViewExams(
	exams: TransformedExam[],
	maxCount: number,
	{ container, width, height, widgetConfig }: ViewBuildData
) {
	let remainingHeight = height
	const charHeight = getCharHeight(widgetConfig.appearance.fontSize)
	const padding = 4
	const containerHeight = charHeight + 2 * padding

	if (remainingHeight < containerHeight) return 0

	const sortedExams = exams.sort((a, b) => a.from.getTime() - b.from.getTime())

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

		// use the long subject name if it fits
		let subjectName = exam.subject
		let longSubjectName = subjectName

		let backgroundColor = colors.background.primary

		// apply the custom name if it exists
		const lessonConfig = widgetConfig.subjects[exam.subject] as SubjectConfig
		if (lessonConfig) {
			// apply the overrides
			if (lessonConfig.nameOverride) subjectName = lessonConfig.nameOverride
			longSubjectName = lessonConfig.longNameOverride
			if (lessonConfig.color) backgroundColor = getColor(lessonConfig.color)

			// apply the teacher override, if only this teacher is in the exam
			if (
				lessonConfig.teachers &&
				exam.teacherNames.length === 1 &&
				lessonConfig.teachers[exam.teacherNames[0]]
			) {
				const teacherConfig = lessonConfig.teachers[exam.teacherNames[0]]
				if (teacherConfig.nameOverride) subjectName = teacherConfig.nameOverride
				if (teacherConfig.longNameOverride) longSubjectName = teacherConfig.longNameOverride
				if (teacherConfig.color) backgroundColor = getColor(teacherConfig.color)
			}
		}

		// get the formatted date
		const shortDate = exam.from.toLocaleString(LOCALE, { day: 'numeric', month: 'short' })
		const longDate = exam.from.toLocaleString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })

		// build the container
		const examContainer = container.addStack()
		examContainer.size = new Size(width, containerHeight)
		examContainer.layoutHorizontally()
		examContainer.setPadding(padding, padding, padding, padding)
		examContainer.spacing = widgetConfig.appearance.spacing
		examContainer.backgroundColor = backgroundColor
		examContainer.cornerRadius = widgetConfig.appearance.cornerRadius

		// build the layout row
		const staticLayoutRow = new StaticLayoutRow(
			width - 2 * padding,
			widgetConfig.appearance.spacing,
			Font.mediumSystemFont(widgetConfig.appearance.fontSize),
			widgetConfig.appearance.fontSize,
			colors.text.primary
		)

		/**
		 * Priorities:
		 * 1. Icon
		 * 2. Subject name
		 * 3. Date
		 * 4. Exam type
		 * 5. Long subject name
		 * 6. Long date
		 */

		// add the exam icon
		staticLayoutRow.addItem({
			type: 'icon',
			icon: 'book.circle',
			size: widgetConfig.appearance.fontSize,
			color: colors.text.primary,
			priority: 1,
		})

		// add the subject name
		staticLayoutRow.addItem({
			type: 'text',
			variants: [
				{
					text: subjectName,
					priority: 2,
				},
				{
					text: longSubjectName,
					priority: 5,
				},
			],
			fontSize: widgetConfig.appearance.fontSize,
			color: colors.text.primary,
		})

		// add the exam type
		staticLayoutRow.addItem({
			type: 'text',
			variants: [{ text: exam.type, priority: 4 }],
			color: colors.text.secondary,
		})

		// add the date
		staticLayoutRow.addItem({
			type: 'text',
			variants: [
				{
					text: shortDate,
					priority: 3,
				},
				{
					text: longDate,
					priority: 6,
				},
			],
			color: colors.text.primary,
		})

		staticLayoutRow.build(examContainer)

		remainingHeight -= containerHeight
		lessonCount++

		// exit if the max item count is reached
		if (maxCount && lessonCount >= maxCount) break

		// exit if it would get too big, use the maximum height
		if (containerHeight + widgetConfig.appearance.spacing > remainingHeight) break
	}

	return height - remainingHeight
}
