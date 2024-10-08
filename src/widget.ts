import { FetchedData, fetchDataForViews } from './api/fetchManager'
import { View } from './layout'
import { getColor } from './settings/colors'
import { Settings } from './settings/settings'
import { getCharHeight, getDateInXSeconds } from './utils/helper'
import { getWidgetSize, getWidgetSizes } from './utils/scriptable/widgetSize'
import { addViewAbsences } from './views/absences'
import { addViewExams } from './views/exams'
import { addFooter, getFooterHeight } from './views/footer'
import { addViewGrades } from './views/grades'
import { addViewLessons } from './views/lessons'
import { addViewPreview } from './views/preview'

export interface ViewBuildData {
	container: WidgetStack
	width: number
	height: number
	widgetConfig: Settings
}

export function checkNewRefreshDate(newDate: Date, fetchedData: FetchedData) {
	if (!fetchedData.refreshDate || newDate < fetchedData.refreshDate) {
		fetchedData.refreshDate = newDate
		return
	}
}

export function proposeRefreshIn(seconds: number, fetchedData: FetchedData) {
	const newDate = getDateInXSeconds(seconds)
	checkNewRefreshDate(newDate, fetchedData)
}

/**
 * Creates the widget by adding as many views to it as fit.
 * Also adds the footer.
 */
export async function createWidget(user: FullUser, layout: View[][], widgetConfig: Settings) {
	const widget = new ListWidget()

	const widgetSizes = getWidgetSizes()

	const paddingHorizontal = Math.max(widgetConfig.appearance.padding, 4)
	const paddingVertical = Math.max(widgetConfig.appearance.padding, 6)

	const widgetSize = getWidgetSize(widgetSizes, config.widgetFamily)
	const contentSize = new Size(widgetSize.width - paddingHorizontal * 2, widgetSize.height - paddingVertical * 2)

	widget.setPadding(paddingHorizontal, paddingVertical, paddingHorizontal, paddingVertical)
	widget.backgroundColor = getColor(widgetConfig.appearance.backgroundColor) ?? Color.black()

	const widgetContent = widget.addStack()
	widgetContent.layoutHorizontally()
	widgetContent.topAlignContent()
	widgetContent.spacing = widgetConfig.appearance.spacing

	// make a list of the shown views (without duplicates)
	const shownViews = new Set<View>()
	for (const column of layout) {
		for (const view of column) {
			shownViews.add(view)
		}
	}

	// fetch the data for the shown views
	const fetchedData = await fetchDataForViews(Array.from(shownViews), user, widgetConfig)

	if (fetchedData.refreshDate) {
		console.log(`Refresh date: ${fetchedData.refreshDate}`)
		widget.refreshAfterDate = fetchedData.refreshDate
	}

	// TODO: flexible layout when only one column
	const columnWidth = contentSize.width / layout.length

	// add all the columns with the views
	for (const column of layout) {
		addColumn(fetchedData, widgetContent, column, contentSize.height, columnWidth, shownViews, widgetConfig)
	}

	if (widgetConfig.appearance.footer) {
		addFooter(widget, contentSize.width, widgetConfig)
	}

	return widget
}

function addColumn(
	fetchedData: FetchedData,
	widgetContent: WidgetStack,
	column: View[],
	height: number,
	width: number,
	shownViews: Set<View>,
	widgetConfig: Settings
) {
	// add the column
	const columnStack = widgetContent.addStack()
	columnStack.layoutVertically()
	columnStack.topAlignContent()
	columnStack.spacing = widgetConfig.appearance.spacing

	// calculate the real available height
	let availableContentHeight = height
	if (widgetConfig.appearance.footer) availableContentHeight -= getFooterHeight(widgetConfig)

	columnStack.size = new Size(width, availableContentHeight)

	let remainingHeight = availableContentHeight

	console.log(`Column has ${availableContentHeight} available height`)

	for (const view of column) {
		const viewData: ViewBuildData = {
			container: columnStack,
			width,
			height: remainingHeight,
			widgetConfig,
		}

		const viewHeight = addView(fetchedData, view, viewData, shownViews)
		remainingHeight -= viewHeight

		console.log(`Added view ${view} with height ${viewHeight}, remaining height: ${remainingHeight}`)

		// subtract the spacing if necessary (view added and enough space left)
		if (viewHeight > 0 && remainingHeight > widgetConfig.appearance.spacing) {
			remainingHeight -= widgetConfig.appearance.spacing
		} else if (remainingHeight <= widgetConfig.appearance.spacing) {
			break
		}
	}

	if (remainingHeight > widgetConfig.appearance.spacing) {
		// add spacer to fill the remaining space
		let space = remainingHeight - widgetConfig.appearance.spacing
		if (space < 0) space = 0
		columnStack.addSpacer(space)
	}
}

/**
 *
 * @param fetchedData
 * @param view
 * @param viewData
 * @param shownViews
 * @return the height of the added view
 */
function addView(fetchedData: FetchedData, view: View, viewData: ViewBuildData, shownViews: Set<View>): number {
	const widgetConfig = viewData.widgetConfig
	const remainingHeight = viewData.height
	// exit if there is not enough space left
	if (remainingHeight <= getCharHeight(widgetConfig.appearance.fontSize)) return 0

	switch (view) {
		case View.LESSONS:
			// show the lessons view if there are lessons today
			if (fetchedData.lessonsTodayRemaining?.length > 0) {
				return addViewLessons(
					fetchedData.lessonsTodayRemaining,
					widgetConfig.views.lessons.maxCount,
					viewData,
					widgetConfig
				)
			}

			// otherwise, show a preview (handles no lessons in the next week)
			return addViewPreview(fetchedData.lessonsNextDay, fetchedData.nextDayKey, viewData)

		case View.PREVIEW:
			if (!fetchedData.lessonsNextDay || fetchedData.lessonsNextDay.length === 0 || !fetchedData.nextDayKey) {
				console.warn(`Tried to add preview view, but no lessons data was fetched`)
				return
			}
			// HACK: only show the day preview, if it is not already shown
			if (shownViews.has(View.LESSONS) && fetchedData.lessonsTodayRemaining?.length === 0) break

			return addViewPreview(fetchedData.lessonsNextDay, fetchedData.nextDayKey, viewData)
		case View.EXAMS:
			if (!fetchedData.exams || fetchedData.exams.length === 0) {
				console.warn(`Tried to add exams view, but no exams data was fetched`)
				return
			}
			return addViewExams(fetchedData.exams, widgetConfig.views.exams.maxCount, viewData)
		case View.GRADES:
			if (!fetchedData.grades || fetchedData.grades.length === 0) {
				console.warn(`Tried to add grades view, but no grades data was fetched`)
				return
			}
			return addViewGrades(fetchedData.grades, widgetConfig.views.grades.maxCount, viewData)
		case View.ABSENCES:
			if (!fetchedData.absences || fetchedData.absences.length === 0) {
				console.warn(`Tried to add absences view, but no absences data was fetched`)
				return
			}
			return addViewAbsences(fetchedData.absences, widgetConfig.views.absences.maxCount, viewData)
	}
}
