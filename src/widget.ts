import { FetchedData, fetchDataForViews } from './api/fetchManager'
import { View, getLastLayoutString, setLastLayoutString } from './layout'
import { getColor, colors } from './settings/colors'
import { Settings } from './settings/settings'
import { getCharHeight, getDateInXSeconds } from './utils/helper'
import { getWidgetSize, getWidgetSizes } from './utils/scriptable/widgetSize'
import { addViewAbsences } from './views/absences'
import { addViewHomeworks } from './views/homeworks'
import { addViewExams } from './views/exams'
import { addFooter, getFooterHeight } from './views/footer'
import { addViewGrades } from './views/grades'
import { addViewLessons } from './views/lessons'
import { addViewPreview } from './views/preview'
import { defaultLayout } from './constants'

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

// Random motivational / funny quotes for empty data views
const EMPTY_VIEW_QUOTES = {
  homeworks: [
    "📚 No homeworks left — time to chill 😎",
    "🎉 Homework-free zone!",
    "🚀 All done — you're a legend!",
    "💤 Nothing to do. Take a nap.",
    "🧠 Brain: finally, some rest!"
  ],
  absences: [
    "🎯 Perfect attendance!",
    "✅ No absences — keep it up!",
    "🏫 You’ve been 100% present!",
    "😇 Attendance angel detected!"
  ],
  exams: [
    "📆 No exams — enjoy the calm!",
    "🎓 Exam-free week — celebrate!",
    "☕ Relax, no tests incoming."
  ],
  grades: [
    "📈 No new grades — yet!",
    "💤 Still waiting for results...",
    "🕐 Patience pays — grades coming soon."
  ],
  lessons: [
    "📖 No lessons right now!",
    "🌴 Class dismissed!",
    "🍀 Free time — use it wisely."
  ]
}

/**
 * Creates the widget by adding as many views to it as fit.
 * Also adds the footer.
 */
export async function createWidget(user: FullUser, layout: View[][], widgetConfig: Settings) {
  console.log("🔹 createWidget() called")
  console.log("Layout:", JSON.stringify(layout, null, 2))
  console.log("WidgetConfig:", JSON.stringify(widgetConfig, null, 2))

  const widget = new ListWidget()
  const widgetSizes = getWidgetSizes()

  const paddingHorizontal = Math.max(widgetConfig.appearance.padding, 8)
  const paddingVertical = Math.max(widgetConfig.appearance.padding, 8)

  const widgetSize = getWidgetSize(widgetSizes, config.widgetFamily)
  const contentWidth = widgetSize.width - paddingHorizontal * 2
  const contentHeight = widgetSize.height - paddingVertical * 2

  widget.setPadding(paddingVertical, paddingHorizontal, paddingVertical, paddingHorizontal)
  widget.backgroundColor = getColor(widgetConfig.appearance.backgroundColor) ?? Color.black()

  // --- Which views will be shown ---
  const shownViews = new Set<View>()
  for (const column of layout) {
    for (const view of column) shownViews.add(view)
  }

  console.log("ShownViews:", Array.from(shownViews))

  // --- Fetch data for shown views ---
  const fetchedData = await fetchDataForViews(Array.from(shownViews), user, widgetConfig)
  console.log("FetchedData keys:", Object.keys(fetchedData))
  for (const key of Object.keys(fetchedData)) {
    const val = fetchedData[key]
    if (Array.isArray(val)) {
      console.log(`  ↪ ${key}: Array(${val.length})`)
    } else {
      console.log(`  ↪ ${key}:`, val)
    }
  }

  if (fetchedData.refreshDate) {
    console.log(`Refresh date: ${fetchedData.refreshDate}`)
    widget.refreshAfterDate = fetchedData.refreshDate
  }

  // --- Heights ---
  let headerFontSize = 14
  let headerHeight = 0
  const showHeader = config.widgetFamily !== "small"
  if (showHeader) headerHeight = headerFontSize + 8

  const footerHeight = widgetConfig.appearance.footer ? getFooterHeight(widgetConfig) : 0
  let availableContentHeight =
    contentHeight - headerHeight - footerHeight - widgetConfig.appearance.spacing * 2
  if (availableContentHeight < 0) availableContentHeight = 0

  const allViews = defaultLayout.split(",").map((v) => v.trim().toLowerCase())
  const shown = Array.from(shownViews)
  const isAll = shown.length === allViews.length

  if (showHeader) {
    const headerStack = widget.addStack()
    headerStack.layoutHorizontally()
    headerStack.centerAlignContent()
    headerStack.size = new Size(contentWidth, headerHeight)
    const headerTitle = isAll
      ? "All"
      : shown.map((v) => v.charAt(0).toUpperCase() + v.slice(1)).join(" & ")
    const header = headerStack.addText(headerTitle)
    header.font = Font.boldSystemFont(headerFontSize)
    header.textColor = colors.text.secondary
    header.centerAlignText()
    widget.addSpacer(4)
  }

  const contentContainer = widget.addStack()
  contentContainer.layoutVertically()
  contentContainer.centerAlignContent()
  contentContainer.size = new Size(contentWidth, availableContentHeight)

  // --- Check if any of the *shown* views actually has data ---
  let hasAnyData = false
  for (const v of shownViews) {
    let data = fetchedData[v]
    // special handling for lessons
    if (v === "lessons") {
      const today = fetchedData.lessonsTodayRemaining ?? []
      const next = fetchedData.lessonsNextDay ?? []
      if ((Array.isArray(today) && today.length > 0) || (Array.isArray(next) && next.length > 0)) {
        data = [...today, ...next]
      }
    }

    if (Array.isArray(data) && data.length > 0) {
      hasAnyData = true
      break
    } else if (data && !Array.isArray(data)) {
      hasAnyData = true
      break
    }
  }
  console.log("➡️ hasAnyData (filtered to shown views):", hasAnyData)

  const columnWidth = contentWidth / Math.max(layout.length, 1)
  const LAST_LAYOUT_STRING = getLastLayoutString()

  if (hasAnyData) {
    console.log("📦 Rendering widget columns...")
    const contentRow = contentContainer.addStack()
    contentRow.layoutHorizontally()
    contentRow.topAlignContent()
    contentRow.spacing = widgetConfig.appearance.spacing
    contentRow.size = new Size(contentWidth, availableContentHeight)

    for (const column of layout) {
      console.log(" → Column:", column)
      addColumn(fetchedData, contentRow, column, availableContentHeight, columnWidth, shownViews, widgetConfig)
    }
  } else {
    console.log("⚠️ No data detected – preparing empty view message.")

    const allColumnsEmpty =
      layout.length > 0 && layout.every((col) => Array.isArray(col) && col.length === 0)

    if (allColumnsEmpty && LAST_LAYOUT_STRING && LAST_LAYOUT_STRING.length > 0) {
      // --- Unknown parameter fallback ---
      const available = Object.values(View).join(", ")
      const title = `Unknown parameter: ${LAST_LAYOUT_STRING}`
      console.warn(`Unknown widget parameter "${LAST_LAYOUT_STRING}"`)
      const titleText = contentContainer.addText(title)
      titleText.font = Font.semiboldSystemFont(14)
      titleText.textColor = colors.text.primary
      titleText.centerAlignText()

      contentContainer.addSpacer(4)
      const infoText = contentContainer.addText(`Available views: ${available}`)
      infoText.font = Font.regularSystemFont(12)
      infoText.textColor = colors.text.secondary
      infoText.centerAlignText()

      setLastLayoutString("")
    } else {
      // --- Valid views but no data ---
      let candidateQuotes = []

      if (shown.length === 1) {
        const viewKey = shown[0]
        candidateQuotes = EMPTY_VIEW_QUOTES[viewKey] ?? ["No data available."]
      } else if (shown.length > 1) {
        // Add some global quotes for fully empty multi-view widgets
        candidateQuotes.push(
          "🧃 Everything’s calm — no news today!",
          "📦 Nothing to show right now.",
          "🌤️ Quiet day ahead!",
          "💡 Looks like everything’s sorted — enjoy your free time!"
        )

        if (candidateQuotes.length === 0) candidateQuotes = ["No data available."]
      } else {
        candidateQuotes = ["No data available."]
      }

      const randomQuote = candidateQuotes[Math.floor(Math.random() * candidateQuotes.length)]
      const noDataText = contentContainer.addText(randomQuote)
      noDataText.font = Font.mediumSystemFont(13)
      noDataText.textColor = colors.text.disabled
      noDataText.centerAlignText()
    }
  }

  if (widgetConfig.appearance.footer) {
    widget.addSpacer()
    addFooter(widget, contentWidth, widgetConfig)
  }

  console.log("✅ createWidget() done\n")
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
				return 0
			}
			// HACK: only show the day preview, if it is not already shown
			if (shownViews.has(View.LESSONS) && fetchedData.lessonsTodayRemaining?.length === 0) break

			return addViewPreview(fetchedData.lessonsNextDay, fetchedData.nextDayKey, viewData)
		case View.EXAMS:
			if (!fetchedData.exams || fetchedData.exams.length === 0) {
				console.warn(`Tried to add exams view, but no exams data was fetched`)
				return 0
			}
			return addViewExams(fetchedData.exams, widgetConfig.views.exams.maxCount, viewData)
		case View.GRADES:
			if (!fetchedData.grades || fetchedData.grades.length === 0) {
				console.warn(`Tried to add grades view, but no grades data was fetched`)
				return 0
			}
			return addViewGrades(fetchedData.grades, widgetConfig.views.grades.maxCount, viewData)
		case View.ABSENCES:
			if (!fetchedData.absences || fetchedData.absences.length === 0) {
				console.warn(`Tried to add absences view, but no absences data was fetched`)
				return 0
			}
			return addViewAbsences(fetchedData.absences, widgetConfig.views.absences.maxCount, viewData)
    case View.HOMEWORKS:
      if (!fetchedData.homeworks || fetchedData.homeworks.length === 0) {
          console.warn(`Tried to add homeworks view, but no homeworks data was fetched`)
          return 0
      }
      return addViewHomeworks(fetchedData.homeworks, widgetConfig.views.homeworks.maxCount, viewData)
	}
}
