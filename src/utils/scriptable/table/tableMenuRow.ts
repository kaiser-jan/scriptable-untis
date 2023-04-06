import { TableMenuCell } from './tableMenuCell'

export interface TableMenuRowTextOptions {
	color?: Color
	font?: Font
	subtitle?: {
		color?: Color
		font?: Font
	}
	width?: number
}

/**
 * Represents a row in a table menu.
 * Allows you to add cells with a width percentage, the weights are calculated when calling `.calculate()`.
 */
export class TableMenuRow {
	private readonly _row: UITableRow
	private readonly _cells: TableMenuCell[]

	constructor(_rowHeight: number = 60) {
		this._row = new UITableRow()
		this._row.dismissOnSelect = false
		this._row.height = _rowHeight
		this._cells = []
	}

	private _addCell(cell: TableMenuCell) {
		this._cells.push(cell)
	}

	/**
	 * Adds a button with the given emoji, using a fitting width by default.
	 * NOTE: The font size (and many other options) cannot be changed for buttons, contrary to the documentation.
	 */
	addIconButton(emoji: string, onTap: () => void, width: number = 6) {
		const cell = this._row.addButton(emoji)
		cell.centerAligned()
		cell.onTap = onTap

		const tableMenuCell = new TableMenuCell(cell, width)
		this._addCell(tableMenuCell)
		return tableMenuCell
	}

	addText(title: string, subtitle: string = '', options: TableMenuRowTextOptions = {}, onTap?: () => void) {
		const cell = this._row.addText(title, subtitle)
		cell.titleFont = options.font ?? Font.mediumSystemFont(16)
		cell.titleColor = options.color
		cell.subtitleFont = options.subtitle?.font ?? Font.systemFont(12)
		cell.subtitleColor = options.subtitle?.color ?? Color.gray()
		cell.onTap = onTap

		const tableMenuCell = new TableMenuCell(cell, options.width)
		this._addCell(tableMenuCell)
		return tableMenuCell
	}

	setHeight(height: number) {
		this._row.height = height
	}

	setOnTap(onTap: () => void) {
		this._row.onSelect = onTap
	}

	setBackgroundColor(color: Color) {
		this._row.backgroundColor = color
	}

	/**
	 * Recalculate the width weight of each cell in the row to achieve the set widths.
	 */
	build() {
		let usedWidth = 0
		let autoWidthCount = 0

		if (this._cells.length === 0) return this._row

		// calculate the width of each cell
		for (const cell of this._cells) {
			if (cell.width !== null) {
				usedWidth += cell.width
			} else {
				autoWidthCount++
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
