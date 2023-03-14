import { defaultLayout } from './constants'

const viewNames = ['lessons', 'preview', 'exams', 'grades', 'absences', 'roles'] as const
export type ViewName = typeof viewNames[number]

function parseLayoutString(layoutString: string) {
	let layout: ViewName[][] = []
	for (const column of layoutString.split('|')) {
		let columnViews: ViewName[] = []
		for (const view of column.split(',')) {
			if (viewNames.includes(view as ViewName)) {
				columnViews.push(view as ViewName)
			} else {
				console.warn(`⚠️ Invalid view name: ${view}`)
			}
		}
		layout.push(columnViews)
	}

	return layout
}

/**
 * Adapts the number of columns in the layout to the widget size.
 */
function adaptLayoutForSize(layout: ViewName[][]) {
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
	console.log(layoutString)
	const layout = adaptLayoutForSize(parseLayoutString(layoutString))
	console.log(layout)
	return layout
}
