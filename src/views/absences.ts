import { LOCALE } from "@/constants"
import { colors } from "@/preferences/colors"
import { Options } from "@/preferences/config"
import { TransformedAbsence } from "@/types/transformed"
import { getCharHeight } from "@/utils/helper"
import { FlowLayoutRow } from "@/utils/layoutHelper"
import { ViewBuildData } from "@/widget"

export function addViewAbsences(
	absences: TransformedAbsence[],
	maxCount: number,
	{ container, width, height }: ViewBuildData,
	options: Options
) {
	let remainingHeight = height
	const lineHeight = getCharHeight(options.appearance.fontSize)
	const padding = 4

	if (height < lineHeight + 2 * padding) return 0

	let absenceCount = 0

	// add the remaining lessons until the max item count is reached
	for (let i = 0; i < absences.length; i++) {
		const absence = absences[i]

		if (absence.isExcused) continue

		// subtract the spacing between the items
		if (i > 0) remainingHeight -= options.appearance.spacing

		const absenceContainer = container.addStack()
		absenceContainer.layoutHorizontally()
		absenceContainer.spacing = options.appearance.spacing
		absenceContainer.backgroundColor = colors.background.primary
		absenceContainer.cornerRadius = options.appearance.cornerRadius

		const flowLayoutRow = new FlowLayoutRow(
			width,
			remainingHeight,
			options.appearance.cornerRadius,
			padding,
			absenceContainer
		)

		flowLayoutRow.addIcon('pills.circle', options.appearance.fontSize, colors.text.secondary)

		// if the absence is not longer than one day, show the date and duration
		if (absence.to.getDate() === absence.from.getDate() && absence.to.getMonth() === absence.from.getMonth()) {
			const fromDate = absence.from.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' })
			flowLayoutRow.addText(
				fromDate,
				Font.mediumSystemFont(options.appearance.fontSize),
				options.appearance.fontSize,
				colors.text.primary
			)

			// the duration in minutes
			const duration = (absence.to.getTime() - absence.from.getTime()) / 1000 / 60
			const hours = Math.floor(duration / 60).toString()
			const minutes = Math.floor(duration % 60)
				.toString()
				.padStart(2, '0')
			// the duration as hh:mm
			const durationString = `${hours}h${minutes}`
			flowLayoutRow.addText(
				durationString,
				Font.mediumSystemFont(options.appearance.fontSize),
				options.appearance.fontSize,
				colors.text.secondary
			)
		}
		// if the absence is longer than one day, show the start and end date as "dd.mm - dd.mm"
		else {
			const from = absence.from.toLocaleString(LOCALE, { day: 'numeric', month: 'short' })
			const to = absence.to.toLocaleString(LOCALE, { day: 'numeric', month: 'short' })
			flowLayoutRow.addText(
				from,
				Font.mediumSystemFont(options.appearance.fontSize),
				options.appearance.fontSize,
				colors.text.primary
			)
			flowLayoutRow.addText(
				'-',
				Font.mediumSystemFont(options.appearance.fontSize),
				options.appearance.fontSize,
				colors.text.secondary
			)
			flowLayoutRow.addText(
				to,
				Font.mediumSystemFont(options.appearance.fontSize),
				options.appearance.fontSize,
				colors.text.primary
			)
		}

		const { resultingWidth, resultingHeight } = flowLayoutRow.finish()

		remainingHeight -= resultingHeight
		absenceCount++

		// exit if the max item count is reached
		if (absenceCount >= maxCount) break

		// exit if it would get too big, use the maximum height
		if (remainingHeight - 2 * lineHeight + options.appearance.spacing < 0) break
	}

	return height - remainingHeight
}