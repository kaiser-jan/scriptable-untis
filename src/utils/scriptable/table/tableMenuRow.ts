import { getTextWidth } from '@/utils/helper'
import { TableMenu } from './tableMenu'

/**
 * Represents a row in a table menu.
 * Allows you to add cells with a width percentage, the weights are calculated when calling `.calculate()`.
 */
export class TableMenuRow {
	private readonly _row: UITableRow
	private readonly _cells: {
		cell: UITableCell
		width: number | null
	}[]

	constructor(private readonly _table: UITable, private readonly _rowHeight: number = 60) {
		this._row = new UITableRow()
		this._row.dismissOnSelect = false
		this._row.height = _rowHeight
		this._cells = []
	}

	private _addCell(cell: UITableCell, width?: number) {
		this._cells.push({
			cell,
			width: width ?? null,
		})
	}

	addIconButton(emoji: string, onTap?: () => void) {
		const cell = this._row.addButton(emoji)
		cell.centerAligned()
		cell.onTap = onTap
		this._addCell(cell, 6)
		return this
	}

	addText(
		text: string,
		options: {
			color?: Color
			font?: Font
			subtitle?: {
				text: string
				color?: Color
				font?: Font
			}
			width?: number
		}
	) {
		const cell = this._row.addText(text, options.subtitle?.text)
		cell.titleFont = options.font ?? Font.mediumSystemFont(16)
		cell.titleColor = options.color
		cell.subtitleFont = options.subtitle?.font ?? Font.systemFont(12)
		cell.subtitleColor = options.subtitle?.color ?? Color.gray()
		this._addCell(cell, options.width)
		return this
	}

	setHeight(height: number) {
		this._row.height = height
		return this
	}

	/**
	 * Recalculate the width weight of each cell in the row to achieve the set widths.
	 */
	build() {
		let usedWidth = 0
		let autoWidthCount = 0
		log('building row')

		if (this._cells.length === 0) return this._row

		// calculate the width of each cell
		for (const cell of this._cells) {
			if (cell.width !== null) {
				usedWidth += cell.width
				log(`cell with fixed width: ${cell.width}`)
			} else {
				autoWidthCount++
				log(`cell with auto width`)
			}
		}

		if (usedWidth !== 100 && autoWidthCount === 0) {
			throw new Error(`TableMenuRow: The sum of all widths in a row must be 100% when not using at least one component with dynamic width (currently ${usedWidth}%)
			Use null as the width for components with dynamic width.`)
		}

		if (usedWidth > 100) {
			throw new Error(
				`TableMenuRow: The sum of all widths in a row cannot be more than 100% (currently ${usedWidth}%)`
			)
		}

		const autoWidth = (100 - usedWidth) / autoWidthCount

		for (const cell of this._cells) {
			cell.cell.widthWeight = cell.width ?? autoWidth
		}

		return this._row
	}
}
