import { TableMenuRow } from './tableMenuRow'

export class TableMenu {
	private _table: UITable
	private readonly _rows: TableMenuRow[]

	constructor(table: UITable, private _previousView?: TableMenu, private _rowHeight: number = 60) {
		this._table = table
		this._rows = []
	}

	private _addRow() {
		const row = new TableMenuRow(this._table, this._rowHeight)

		// add the back button if this is the first row
		if (this._rows.length === 0 && this._previousView) {
			row.addIconButton('◀️', () => this.showPreviousView())
		}

		this._rows.push(row)
		return row
	}

	addTitleRow(title: string, subtitle?: string) {
		const row = this._addRow()

		row.addText(title, {
			font: Font.semiboldSystemFont(28),
			subtitle: {
				text: subtitle,
				font: Font.systemFont(16),
				color: Color.gray(),
			},
		})

		return row
	}

	addDescriptionRow(text: string) {
		const row = this._addRow()

		row.addText(text, {
			font: Font.mediumSystemFont(16),
			color: Color.dynamic(Color.darkGray(), Color.lightGray()),
		})

		return row
	}

	addSpacerRow() {
		const row = this._addRow()
		row.setHeight(this._rowHeight / 2)
		return row
	}

	addTextRow(title: string, subtitle?: string) {
		const row = this._addRow()

		row.addText(title, {
			font: Font.mediumSystemFont(16),
			subtitle: {
				text: subtitle,
				font: Font.systemFont(14),
				color: Color.gray(),
			},
		})

		return row
	}

	update() {
		console.log('updating table menu')
		this._table.removeAllRows()
		this._rows.forEach((row) => {
			this._table.addRow(row.build())
		})
		this._table.reload()
	}

	show(forceNewView = false) {
		if (this._previousView && !forceNewView) {
			console.log('showing as subview')
			this.update()
			return
		}

		console.log('showing as new view')
		this._table = new UITable()
		this.update()
		this._table.present()
	}

	createSubView(rowHeight?: number) {
		console.log('creating sub view')
		const subView = new TableMenu(this._table, this, rowHeight ?? this._rowHeight)
		subView._previousView = this
		return subView
	}

	showPreviousView() {
		console.log('showing previous view')
		console.log(this._previousView ? 'exists' : 'undefined')
		this._previousView?.update()
	}
}
