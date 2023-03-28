export class TableMenuCell {
	private _cell: UITableCell
	public width: number | null

    constructor(cell: UITableCell, width?: number) {
        this._cell = cell
        this.width = width ?? null
    }

    get cell() {
        return this._cell
    }
}
