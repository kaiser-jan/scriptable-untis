import { colors } from '@/settings/colors'
import { TransformedGrade } from '@/types/transformed'
import { getCharHeight } from '@/utils/helper'
import { FlowLayoutRow } from '@/utils/scriptable/layoutHelper'
import { ViewBuildData } from '@/widget'

export function addViewGrades(
	grades: TransformedGrade[],
	maxCount: number,
	{ container, width, height, widgetConfig }: ViewBuildData
) {
	let remainingHeight = height
	const lineHeight = getCharHeight(widgetConfig.appearance.fontSize)
	const padding = 4

	if (height < lineHeight + 2 * padding) return 0

	// sort the grades by date (newest first)
	const sortedGrades = grades.sort((a, b) => b.date.getTime() - a.date.getTime())

	let gradeCount = 0

	// add the remaining lessons until the max item count is reached
	for (let i = 0; i < sortedGrades.length; i++) {
		const grade = sortedGrades[i]

		// subtract the spacing between the items
		if (i > 0) remainingHeight -= widgetConfig.appearance.spacing

		const gradeContainer = container.addStack()
		gradeContainer.layoutHorizontally()
		gradeContainer.spacing = widgetConfig.appearance.spacing
		gradeContainer.backgroundColor = colors.background.primary
		gradeContainer.cornerRadius = widgetConfig.appearance.cornerRadius

		const flowLayoutRow = new FlowLayoutRow(
			width,
			remainingHeight,
			widgetConfig.appearance.spacing,
			padding,
			gradeContainer
		)

		let usingIcon = true
		let symbolName = 'circle'

		if (grade.schemaId === 1) {
			// 1 - 5
			symbolName = `${grade.mark.displayValue}.circle`
		} else if (grade.schemaId === 3) {
			// +, ~, -
			if (grade.mark.displayValue === 1) symbolName = 'plus.square'
			else if (grade.mark.displayValue === 2) symbolName = 'equal.square'
			else if (grade.mark.displayValue === 3) symbolName = 'minus.square'
		} else if (grade.schemaId === 24) {
			// ++, +, ~, -
			if (grade.mark.displayValue === 1) symbolName = 'cross.circle'
			else if (grade.mark.displayValue === 2) symbolName = 'plus.circle'
			else if (grade.mark.displayValue === 3) symbolName = 'equal.circle'
			else if (grade.mark.displayValue === 4) symbolName = 'minus.circle'
		} else {
			usingIcon = false
		}

		if (usingIcon) {
			flowLayoutRow.addIcon(symbolName, widgetConfig.appearance.fontSize, colors.text.primary)
		} else {
			flowLayoutRow.addText(
				grade.mark.name,
				Font.mediumSystemFont(widgetConfig.appearance.fontSize),
				widgetConfig.appearance.fontSize,
				colors.text.primary
			)
		}

		flowLayoutRow.addText(
			grade.subject,
			Font.mediumSystemFont(widgetConfig.appearance.fontSize),
			widgetConfig.appearance.fontSize,
			colors.text.primary
		)

		flowLayoutRow.addText(
			grade.examType.name,
			Font.regularSystemFont(widgetConfig.appearance.fontSize),
			widgetConfig.appearance.fontSize,
			colors.text.secondary
		)

		const { resultingWidth, resultingHeight } = flowLayoutRow.finish()

		remainingHeight -= resultingHeight
		gradeCount++

		// exit if the max item count is reached
		if (maxCount && gradeCount >= maxCount) break

		// exit if it would get too big, use the maximum height
		if (remainingHeight - 3 * lineHeight + 2 * widgetConfig.appearance.spacing < 0) break
	}

	return height - remainingHeight
}
