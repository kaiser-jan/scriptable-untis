import { LOCALE } from '@/constants'
import { colors } from '@/settings/colors'
import { TransformedAbsence } from '@/types/transformed'
import { Duration } from '@/utils/duration'
import { getCharHeight } from '@/utils/helper'
import { FlowLayoutRow } from '@/utils/scriptable/layout/flowLayoutRow'
import { StaticLayoutRow } from '@/utils/scriptable/layout/staticLayoutRow'
import { ViewBuildData } from '@/widget'

export function addViewAbsences(
	absences: TransformedAbsence[],
	maxCount: number,
	{ container, width, height, widgetConfig }: ViewBuildData
) {
	let remainingHeight = height
	const charHeight = getCharHeight(widgetConfig.appearance.fontSize)
	const padding = 4
	const containerHeight = charHeight + 2 * padding

	if (height < containerHeight) return 0

	let absenceCount = 0

	// add the remaining lessons until the max item count is reached
	for (let i = 0; i < absences.length; i++) {
		const absence = absences[i]

		if (absence.isExcused) continue

		// subtract the spacing between the items
		if (i > 0) remainingHeight -= widgetConfig.appearance.spacing

		const absenceContainer = container.addStack()
		absenceContainer.size = new Size(width, containerHeight)
		absenceContainer.layoutHorizontally()
		absenceContainer.setPadding(padding, padding, padding, padding)
		absenceContainer.spacing = widgetConfig.appearance.spacing
		absenceContainer.backgroundColor = colors.background.primary
		absenceContainer.cornerRadius = widgetConfig.appearance.cornerRadius

		const shortFromDate = absence.from.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' })
		const longFromDate = absence.from.toLocaleDateString(LOCALE, {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
		})

		const durationMilliseconds = absence.to.getTime() - absence.from.getTime()
		const duration = Duration.fromSeconds(durationMilliseconds / 1000)
		const formattedDurationSimple = duration.toString()
		const formattedDurationMixed = duration.toMixedUnitString()

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
		 * 1. icon
		 * 2. date
		 * 3. duration
		 * 4. long duration (mixed units)
		 * 5. long date
		 * 6. creator
		 * TODO(transform): reason (parse reasons when transforming)
		 */

		// add the absence icon
		staticLayoutRow.addItem({
			type: 'icon',
			icon: 'pills.circle',
			size: widgetConfig.appearance.fontSize,
			color: colors.text.secondary,
			priority: 1,
		})

		// add the absence duration
		staticLayoutRow.addItem({
			type: 'text',
			variants: [
				{
					text: formattedDurationSimple,
					priority: 3,
				},
				{
					text: formattedDurationMixed,
					priority: 4,
				},
			],
		})

		// add the absence date
		staticLayoutRow.addItem({
			type: 'text',
			color: colors.text.secondary,
			variants: [
				{
					text: shortFromDate,
					priority: 2,
				},
				{
					text: longFromDate,
					priority: 5,
				},
			],
		})

		// add the creator
		staticLayoutRow.addItem({
			type: 'text',
			color: colors.text.secondary,
			variants: [
				{
					// toLoweCase to make it less prominent
					text: absence.createdBy.toLowerCase(),
					priority: 6,
				},
			],
		})

		staticLayoutRow.build(absenceContainer)

		remainingHeight -= containerHeight
		absenceCount++

		// exit if the max item count is reached
		if (absenceCount >= maxCount) break

		// exit if it would get too big, use the maximum height
		if (containerHeight + widgetConfig.appearance.spacing > remainingHeight) break
	}

	return height - remainingHeight
}
