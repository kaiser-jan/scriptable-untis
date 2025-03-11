import { defaultLayout } from './constants'
import { getKeyByValue } from './utils/helper'

export enum View {
	LESSONS = 'lessons',
	PREVIEW = 'preview',
	EXAMS = 'exams',
	GRADES = 'grades',
	ABSENCES = 'absences',
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

export function getLayout() {
	const layoutString = args.widgetParameter ?? defaultLayout
	console.log(`Parsing layout string "${layoutString}..."`)
	const layout = adaptLayoutForSize(parseLayoutString(layoutString))
	console.log(`Got parsed layout: ${layout}`)
	return layout
}
