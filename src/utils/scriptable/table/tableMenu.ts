import { openValueEditor } from '@/preferences/editor/valueEditor'
import { TableMenuRow } from './tableMenuRow'
import { Description } from '@/types/config'

export class TableMenu {
	private _table: UITable
	private _rows: TableMenuRow[]

	constructor(table?: UITable, private _previousView?: TableMenu, private _rowHeight: number = 60) {
		this._table = table ?? new UITable()
		this._rows = []
	}

	private _addRow() {
		const row = new TableMenuRow(this._rowHeight)

		// add the back button if this is the first row
		if (this._rows.length === 0 && this._previousView) {
			row.addIconButton('⬅️', () => this.showPreviousView(), 15)
		}

		this._rows.push(row)
		return row
	}

	addTitleRow(title: string, subtitle?: string) {
		const row = this._addRow()

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

		row.addText(text, '', {
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

		row.addText(title, subtitle, {
			font: Font.mediumSystemFont(16),
			subtitle: {
				font: Font.systemFont(12),
				color: Color.gray(),
			},
		})

		return row
	}

	update() {
		this._table.removeAllRows()
		this._rows.forEach((row) => {
			this._table.addRow(row.build())
		})
		this._table.reload()
	}

	show(forceNewView = false) {
		if (this._previousView && !forceNewView) {
			this.update()
			return
		}

		this._table = new UITable()
		this.update()
		this._table.present()
	}

	createSubView(rowHeight?: number) {
		const subView = new TableMenu(this._table, this, rowHeight ?? this._rowHeight)
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
