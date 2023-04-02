import { getCharHeight, getTextWidth } from '../helper'
import { addSymbol } from './componentHelper'

/**
 * A helper class which can be used to lay out items in a horizontal flow layout.
 * This makes it possible to wrap to the next line if the items exceed the maximum width.
 */
export class FlowLayoutRow {
	private currentRowWidth = 0
	private currentRowHeight = 0
	private previousTotalHeight = 0
	private currentRow: WidgetStack

	constructor(
		public readonly maxWidth: number,
		public readonly maxHeight: number,
		public readonly spacing: number,
		public readonly padding: number,
		public readonly container: WidgetStack
	) {
		this.container.layoutVertically()
		if (padding > 0) {
			this.container.setPadding(padding, padding, padding, padding)
		}
		this.currentRow = this.container.addStack()
		this.currentRow.layoutHorizontally()
		this.currentRow.spacing = spacing
		this.maxWidth -= padding * 2
		this.maxHeight -= padding * 2
	}

	private addRow() {
		if (this.previousTotalHeight > this.maxHeight) {
			// console.warn('FlowLayoutRow: Cannot add row, max height reached')
			return
		}
		if (this.currentRowHeight !== 0) {
			this.previousTotalHeight += this.currentRowHeight + this.spacing
		}
		this.currentRow = this.container.addStack()
		this.currentRow.layoutHorizontally()
		this.currentRow.spacing = this.spacing
		this.currentRowWidth = 0
		this.currentRowHeight = 0
	}

	private checkCreateRow(componentWidth: number, componentHeight: number) {
		let spacing = this.currentRowWidth === 0 ? 0 : this.spacing
		const theoreticalWidth = this.currentRowWidth + componentWidth + spacing

		// add a new row if the width is not enough
		if (this.currentRowWidth !== 0 && theoreticalWidth > this.maxWidth) {
			this.addRow()
		}

		// check if the height would overflow
		if (componentHeight > this.currentRowHeight) {
			if (this.previousTotalHeight + this.currentRowHeight > this.maxHeight) {
				return false
			}
			// update the current row height
			this.currentRowHeight = componentHeight
		}

		this.currentRowWidth += componentWidth + spacing

		return true
	}

	public addText(text: string, font: Font, fontSize: number, color: Color) {
		const width = getTextWidth(text, fontSize)
		if (!this.checkCreateRow(width, getCharHeight(fontSize))) {
			return false
		}
		const textElement = this.currentRow.addText(text)
		textElement.font = font
		textElement.textColor = color
		textElement.lineLimit = 1
		return true
	}

	public addIcon(icon: string, size: number, color: Color) {
		if (!this.checkCreateRow(size * 1.1, size * 1.1)) {
			return false
		}
		addSymbol(icon, this.currentRow, { size, color })
		return true
	}

	public addContainer(width: number, height: number, flexibleSize?: boolean) {
		if (!this.checkCreateRow(width, height)) {
			return
		}
		const container = this.currentRow.addStack()
		if (!flexibleSize) {
			container.size = new Size(width, height)
		}
		return container
	}

	public finish() {
		const totalWidth = this.maxWidth + this.padding * 2
		const totalHeight = this.previousTotalHeight + this.currentRowHeight + this.padding * 2
		this.container.size = new Size(totalWidth, totalHeight)

		return {
			resultingWidth: this.maxWidth * 2 * this.padding,
			resultingHeight: totalHeight,
		}
	}
}
