import { CURRENT_DATETIME } from '@/constants'
import { FetchedData, fetchDataForViews } from './api/fetchManager'
import { View } from './layout'
import { Options } from './preferences/config'
import { getCharHeight } from './utils/helper'
import { getWidgetSize, getWidgetSizes } from './utils/widgetSize'
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
	options: Options
}

export function checkNewRefreshDate(newDate: Date, fetchedData: FetchedData) {
	if (!fetchedData.refreshDate || newDate < fetchedData.refreshDate) {
		fetchedData.refreshDate = newDate
		return
	}
}

export function proposeRefreshInXHours(hours: number, fetchedData: FetchedData) {
	const newDate = new Date(CURRENT_DATETIME)
	newDate.setHours(newDate.getHours() + hours)
	checkNewRefreshDate(newDate, fetchedData)
}

/**
 * Creates the widget by adding as many views to it as fit.
 * Also adds the footer.
 */
export async function createWidget(user: FullUser, layout: View[][], options: Options) {
	const widget = new ListWidget()

	const widgetSizes = getWidgetSizes()

	const paddingHorizontal = Math.max(options.appearance.padding, 4)
	const paddingVertical = Math.max(options.appearance.padding, 6)

	const widgetSize = getWidgetSize(widgetSizes, config.widgetFamily)
	const contentSize = new Size(widgetSize.width - paddingHorizontal * 2, widgetSize.height - paddingVertical * 2)

	widget.setPadding(paddingHorizontal, paddingVertical, paddingHorizontal, paddingVertical)
	widget.backgroundColor = Color.black()

	const widgetContent = widget.addStack()
	widgetContent.layoutHorizontally()
	widgetContent.topAlignContent()
	widgetContent.spacing = options.appearance.spacing

	// make a list of the shown views (without duplicates)
	const shownViews = new Set<View>()
	for (const column of layout) {
		for (const view of column) {
			shownViews.add(view)
		}
	}

	// fetch the data for the shown views
	const fetchedData = await fetchDataForViews(Array.from(shownViews), user, options)

	if (fetchedData.refreshDate) {
		console.log(`Refresh date: ${fetchedData.refreshDate}`)
		widget.refreshAfterDate = fetchedData.refreshDate
	}

	// TODO: flexible layout when only one column
	const columnWidth = contentSize.width / layout.length

	// add all the columns with the views
	for (const column of layout) {
		addColumn(fetchedData, widgetContent, column, contentSize.height, columnWidth, shownViews, options)
	}

	if (options.footer.show) {
		addFooter(widget, contentSize.width, options)
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
	options: Options
) {
	// add the column
	const columnStack = widgetContent.addStack()
	columnStack.layoutVertically()
	columnStack.topAlignContent()
	columnStack.spacing = options.appearance.spacing

	// calculate the real available height
	let availableContentHeight = height
	if (options.footer.show) availableContentHeight -= getFooterHeight(options)

	columnStack.size = new Size(width, availableContentHeight)

	let remainingHeight = availableContentHeight

	console.log(`Column has ${availableContentHeight} available height`)

	for (const view of column) {
		const viewData: ViewBuildData = {
			container: columnStack,
			width,
			height: remainingHeight,
			options,
		}

		const viewHeight = addView(fetchedData, view, viewData, shownViews)
		// add the spacing if necessary (view added and enough space left)
		if (viewHeight > 0 && remainingHeight > options.appearance.spacing) {
			remainingHeight -= options.appearance.spacing
		}

		remainingHeight -= viewHeight

		console.log(`Added view ${view} with height ${viewHeight}, remaining height: ${remainingHeight}`)
	}

	if (remainingHeight > options.appearance.spacing) {
		// add spacer to fill the remaining space
		let space = remainingHeight - options.appearance.spacing
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
function addView(fetchedData: FetchedData, view: View, viewData: ViewBuildData, shownViews: Set<View>): number | 0 {
	const options = viewData.options
	const remainingHeight = viewData.height
	// exit if there is not enough space left
	if (remainingHeight <= getCharHeight(options.appearance.fontSize)) return

	switch (view) {
		case View.LESSONS:
			if (!fetchedData.lessonsTodayRemaining || !fetchedData.lessonsNextDay || !fetchedData.nextDayKey) {
				console.warn(`Tried to add lessons view, but no lessons data was fetched`)
				return
			}
			// show a preview if there are no lessons today anymore
			if (fetchedData.lessonsTodayRemaining.length > 0) {
				return addViewLessons(
					fetchedData.lessonsTodayRemaining,
					options.views.lessons.maxCount,
					viewData,
					options
				)
			} else {
				return addViewPreview(fetchedData.lessonsNextDay, fetchedData.nextDayKey, viewData, options)
			}
		case View.PREVIEW:
			if (!fetchedData.lessonsNextDay || !fetchedData.nextDayKey) {
				console.warn(`Tried to add preview view, but no lessons data was fetched`)
				return
			}
			// only show the day preview, if it is not already shown
			if (shownViews.has(View.LESSONS) && fetchedData.lessonsTodayRemaining?.length === 0) break

			return addViewPreview(fetchedData.lessonsNextDay, fetchedData.nextDayKey, viewData, options)
		case View.EXAMS:
			if (!fetchedData.exams) {
				console.warn(`Tried to add exams view, but no exams data was fetched`)
				return
			}
			return addViewExams(fetchedData.exams, options.views.exams.maxCount, viewData, options)
		case View.GRADES:
			if (!fetchedData.grades) {
				console.warn(`Tried to add grades view, but no grades data was fetched`)
				return
			}
			return addViewGrades(fetchedData.grades, options.views.grades.maxCount, viewData, options)
		case View.ABSENCES:
			if (!fetchedData.absences) {
				console.warn(`Tried to add absences view, but no absences data was fetched`)
				return
			}
			return addViewAbsences(fetchedData.absences, options.views.absences.maxCount, viewData, options)
	}
}
