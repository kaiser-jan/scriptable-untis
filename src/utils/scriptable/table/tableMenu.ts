import { TableMenuRow } from './tableMenuRow'

export class TableMenu {
	private _table: UITable
	private _rows: TableMenuRow[]

	constructor(
		table?: UITable,
		private _previousView?: TableMenu,
		private _customBackFunction?: () => void,
		private _rowHeight: number = 60
	) {
		this._table = table ?? new UITable()
		this._rows = []
		// NOTE: this is not working (at least in fullscreen)
		// this._table.showSeparators = true
	}

	private _addRow() {
		const row = new TableMenuRow(this._rowHeight)

		// add the back button if this is the first row
		if (this._rows.length === 0 && this._previousView) {
			row.addIconButton(
				'⬅️',
				() => {
					if (this._customBackFunction) {
						this._customBackFunction()
					} else {
						this.showPreviousView()
					}
				},
				15
			)
		}

		this._rows.push(row)
		return row
	}

	addTitleRow(title: string, subtitle?: string) {
		const row = this._addRow()
		row.setHeight(this._rowHeight * 0.75)

		row.addText(title, subtitle, {
			font: Font.semiboldSystemFont(28),
			subtitle: {
				font: Font.systemFont(16),
				color: Color.gray(),
			},
		})

		return row
	}

	addDescriptionRow(text: string) {
		const row = this._addRow()
		row.setHeight(this._rowHeight * 0.5)

		row.addText(text, '', {
			font: Font.mediumSystemFont(16),
			color: Color.dynamic(Color.darkGray(), Color.lightGray()),
		})

		return row
	}

	addSpacerRow() {
		const row = this._addRow()
		row.setHeight(this._rowHeight / 4)
		return row
	}

	addEmptyRow(height = this._rowHeight / 2) {
		const row = this._addRow()
		row.setHeight(height)
		return row
	}

	addTextRow(title: string, subtitle?: string) {
		const row = this._addRow()

		row.addText(title, subtitle, {
			font: Font.mediumSystemFont(16),
			subtitle: {
				font: Font.systemFont(12),
				color: Color.gray(),
			},
		})

		return row
	}

	addButtonRow(title: string, subtitle?: string, onTap?: () => void) {
		const row = this._addRow()

		row.addText(title, subtitle, {
			font: Font.mediumSystemFont(16),
			color: Color.blue(),
			subtitle: {
				font: Font.systemFont(12),
				color: Color.gray(),
			},
		})

		if (onTap) {
			row.setOnTap(onTap)
		}

		return row
	}

	update() {
		this._table.removeAllRows()
		this._rows.forEach((row) => {
			this._table.addRow(row.build())
		})
		this._table.reload()
	}

	show(forceNewView = false, fullscreen = false) {
		if (this._previousView && !forceNewView) {
			this.update()
			return
		}

		this._table = new UITable()
		this.update()
		this._table.present(fullscreen)
	}

	createSubView(customBackFunction?: () => void, rowHeight?: number) {
		const subView = new TableMenu(this._table, this, customBackFunction, rowHeight ?? this._rowHeight)
		subView._previousView = this
		return subView
	}

	showPreviousView() {
		this._previousView?.update()
	}

	reset() {
		this._table.removeAllRows()
		this._rows = []
	}
}
