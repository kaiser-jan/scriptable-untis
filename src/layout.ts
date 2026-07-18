import { defaultLayout } from './constants'
import { getKeyByValue } from './utils/helper'

export enum View {
	LESSONS = 'lessons',
	PREVIEW = 'preview',
	EXAMS = 'exams',
	GRADES = 'grades',
	ABSENCES = 'absences',
	HOMEWORKS = 'homeworks',
}

function parseLayoutString(layoutString: string) {
	let layout: View[][] = []
	for (const column of layoutString.split('|')) {
		let columnViews: View[] = []

		for (const viewKey of column.split(',')) {
			if (Object.values(View).includes(viewKey as View)) {
				const viewItem = View[getKeyByValue(View, viewKey)]
				columnViews.push(viewItem)
			} else {
				console.warn(`⚠️ Invalid view name: ${viewKey}`)
			}
		}
		layout.push(columnViews)
	}

	return layout
}

/**
 * Adapts the number of columns in the layout to the widget size.
 */
function adaptLayoutForSize(layout: View[][]) {
	switch (config.widgetFamily) {
		case 'small':
			return layout.slice(0, 1)
		case 'medium':
		case 'large':
			return layout.slice(0, 2)
		default:
			return layout
	}
}

// keep the last raw layout string (so createWidget can show better error messages)
let LAST_LAYOUT_STRING = ""
export function getLayout() {
    let layoutStringRaw = args.widgetParameter?.trim() ?? ""
    LAST_LAYOUT_STRING = layoutStringRaw // store raw param for createWidget
    let layoutString = layoutStringRaw
    console.log(`Parsing layout string "${layoutString}"...`)

    // Handle "all" or empty parameter
    if (layoutString === "" || layoutString.toLowerCase() === "all") {
        layoutString = defaultLayout
        // If it was truly empty, clear LAST_LAYOUT_STRING so we don't treat it as "unknown"
        if (layoutStringRaw === "") LAST_LAYOUT_STRING = ""
    }

    // Allow comma-separated values (e.g. "homeworks,lessons")
    layoutString = layoutString
        .split(",")
        .map(v => v.trim().toLowerCase())
        .filter(v => v.length > 0)
        .join(",")

    const layout = adaptLayoutForSize(parseLayoutString(layoutString))
    console.log(`Got parsed layout: ${layout}`)
    return layout
}

export function getLastLayoutString(): string {
    return LAST_LAYOUT_STRING
}

export function setLastLayoutString(value: string) {
	LAST_LAYOUT_STRING = value
}