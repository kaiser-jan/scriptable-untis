import { LOCALE } from '@/constants'
import { colors } from '@/settings/colors'
import { TransformedGrade } from '@/types/transformed'
import { getCharHeight } from '@/utils/helper'
import { StaticLayoutRow } from '@/utils/scriptable/layout/staticLayoutRow'
import { ViewBuildData } from '@/widget'

export function addViewGrades(
	grades: TransformedGrade[],
	maxCount: number,
	{ container, width, height, widgetConfig }: ViewBuildData
) {
	let remainingHeight = height
	const charHeight = getCharHeight(widgetConfig.appearance.fontSize)
	const padding = 4
	const containerHeight = charHeight + 2 * padding

	if (height < containerHeight) return 0

	// sort the grades by date (newest first)
	const sortedGrades = grades.sort((a, b) => b.date.getTime() - a.date.getTime())

	let gradeCount = 0

	// add the remaining lessons until the max item count is reached
	for (let i = 0; i < sortedGrades.length; i++) {
		const grade = sortedGrades[i]

		// subtract the spacing between the items
		if (i > 0) remainingHeight -= widgetConfig.appearance.spacing

		const gradeContainer = container.addStack()
		gradeContainer.size = new Size(width, containerHeight)
		gradeContainer.layoutHorizontally()
		gradeContainer.setPadding(padding, padding, padding, padding)
		gradeContainer.spacing = widgetConfig.appearance.spacing
		gradeContainer.backgroundColor = colors.background.primary
		gradeContainer.cornerRadius = widgetConfig.appearance.cornerRadius

		// get the formatted date
		const shortDate = grade.date.toLocaleString(LOCALE, { day: 'numeric', month: 'short' })
		const longDate = grade.date.toLocaleString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })

		const defaultIconName = 'graduationcap.circle'
		let iconName = undefined

		if (grade.schemaId === 1) {
			// 1 - 5
			iconName = `${grade.mark.displayValue}.circle`
		} else if (grade.schemaId === 3) {
			// +, ~, -
			if (grade.mark.displayValue === 1) iconName = 'plus.square'
			else if (grade.mark.displayValue === 2) iconName = 'equal.square'
			else if (grade.mark.displayValue === 3) iconName = 'minus.square'
		} else if (grade.schemaId === 24) {
			// ++, +, ~, -
			if (grade.mark.displayValue === 1) iconName = 'star.circle'
			else if (grade.mark.displayValue === 2) iconName = 'plus.circle'
			else if (grade.mark.displayValue === 3) iconName = 'equal.circle'
			else if (grade.mark.displayValue === 4) iconName = 'minus.circle'
		}

		// TODO: apply lesson config
		// NOTE: check teacher config possibility, currently teacher is not available here

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
		 * 1. icon ?? grade
		 * 2. subject
		 * 3. icon if default
		 * 4. short date
		 * 5. exam type
		 * 6. long date
		 */

		// add the grade icon
		staticLayoutRow.addItem({
			type: 'icon',
			icon: iconName ?? defaultIconName,
			size: widgetConfig.appearance.fontSize,
			color: colors.text.secondary,
			priority: iconName ? 1 : 3,
		})

		// show the grade name if there is no mark icon
		if (!iconName) {
			// add the grade name
			staticLayoutRow.addItem({
				type: 'text',
				variants: [
					{
						text: grade.mark.name,
						priority: 1,
					},
				],
				color: colors.text.primary,
			})
		}

		// add the subject
		staticLayoutRow.addItem({
			type: 'text',
			variants: [
				{
					text: grade.subject,
					priority: 2,
				},
			],
			color: colors.text.primary,
		})

		// add the exam type
		staticLayoutRow.addItem({
			type: 'text',
			variants: [
				{
					text: grade.examType.name,
					priority: 5,
				},
			],
			color: colors.text.secondary,
		})

		// add the date
		staticLayoutRow.addItem({
			type: 'text',
			color: colors.text.secondary,
			variants: [
				{
					text: shortDate,
					priority: 4,
				},
				{
					text: longDate,
					priority: 6,
				},
			],
		})

		staticLayoutRow.build(gradeContainer)

		remainingHeight -= containerHeight
		gradeCount++

		// exit if the max item count is reached
		if (maxCount && gradeCount >= maxCount) break

		// exit if it would get too big, use the maximum height
		if (containerHeight + widgetConfig.appearance.spacing > remainingHeight) break
	}

	return height - remainingHeight
}
