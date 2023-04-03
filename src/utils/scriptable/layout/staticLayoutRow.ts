import { getTextWidth } from '@/utils/helper'
import { addSymbol } from '../componentHelper'

// the elements as they are added to the row
type StaticLayoutSlotText = {
	type: 'text'
	variants: {
		text: string
		priority: number
	}[]
	font?: Font
	fontSize?: number
	color?: Color
}

type StaticLayoutSlotIcon = {
	type: 'icon'
	icon: string
	color?: Color
	size: number
	priority: number
}

type StaticLayoutSlot = StaticLayoutSlotText | StaticLayoutSlotIcon

// the elements when they are listed for sorting
type StaticLayoutMetaItemBase = {
	type: string
	priority: number
	slotIndex: number
}

type StaticLayoutMetaText = StaticLayoutMetaItemBase & {
	type: 'text'
	text: string
}

type StaticLayoutMetaIcon = StaticLayoutMetaItemBase & {
	type: 'icon'
	icon: string
}

type StaticLayoutMeta = StaticLayoutMetaText | StaticLayoutMetaIcon

// the elements when they are built
type StaticLayoutItemBase = {
	width: number
}

type StaticLayoutItemText = Omit<StaticLayoutSlotText, 'variants'> &
	StaticLayoutItemBase & {
		text: string
	}

type StaticLayoutItemIcon = Omit<StaticLayoutSlotIcon, 'priority'> & StaticLayoutItemBase

type StaticLayoutItem = StaticLayoutItemText | StaticLayoutItemIcon

/**
 * A utility class which can be used to manage items (of a WidgetStack) in a row.
 * This will manage which items to show, and which version of them (e.g. short or long) so they still fit in one row.
 * The items and versions are chosen based on their priority index, from lowest to highest.
 * You can mix the priorities of items and their versions.
 * This means that an item VERSION with a higher priority will be shown instead of an ITEM with a lower priority.
 */
export class StaticLayoutRow {
	private _maxWidth: number
	private _slots: StaticLayoutSlot[] = []
	private _defaultFont: Font = Font.systemFont(12)
	private _defaultFontSize = 12
	private _defaultColor: Color = Color.black()
	private _spacing = 0

	constructor(width: number, spacing: number, font: Font, fontSize: number, color: Color) {
		this._maxWidth = width
		this._defaultFont = font
		this._defaultFontSize = fontSize
		this._defaultColor = color
		this._spacing = spacing
	}

	public addItem(options: StaticLayoutSlot) {
		this._slots.push(options)
	}

	public build(container: WidgetStack) {
		// create a list of all item versions
		const metaItems: StaticLayoutMeta[] = this.flattenSlots()

		// sort the items by priority
		const sortedMetaItems = metaItems.sort((a, b) => a.priority - b.priority)

		// create a list of the items that will be shown
		const items: (StaticLayoutItem | undefined)[] = new Array(this._slots.length).fill(undefined)

		// go over the sorted item meta list and show the items
		let currentWidth = 0
		for (const meta of sortedMetaItems) {
			// get the slot
			const slot = this._slots[meta.slotIndex]

			// get the item
			const item = this.combineMetaAndSlot(meta, slot)

			// skip if the item is too wide
			if (currentWidth + item.width > this._maxWidth) continue

			// if the item is already set, remove its width as it will be replaced
			if (items[meta.slotIndex]) {
				currentWidth -= items[meta.slotIndex].width + this._spacing
			}

			items[meta.slotIndex] = item
			currentWidth += item.width + this._spacing
		}

		// add the items to the stack (necessary to keep the order)
		for (const item of items) {
			if (!item) continue
			this.addItemToStack(container, item)
		}

		// add a spacer to the end to fill the row
		container.addSpacer()
	}

	private addItemToStack(container: WidgetStack, item: StaticLayoutItem) {
		if (item.type === 'text') {
			const textItem = item as StaticLayoutItemText
			const text = container.addText(textItem.text)
			text.font = textItem.font
			text.textColor = textItem.color
			text.lineLimit = 1
		} else if (item.type === 'icon') {
			const iconItem = item as StaticLayoutItemIcon
			const icon = addSymbol(iconItem.icon, container, { color: iconItem.color, size: iconItem.size })
		}
	}

	private flattenSlots() {
		const metaItems: StaticLayoutMeta[] = []
		for (const slot of this._slots) {
			// check if the slot is an icon
			if (slot.type === 'icon') {
				metaItems.push({
					type: slot.type,
					priority: slot.priority,
					slotIndex: this._slots.indexOf(slot),
					icon: slot.icon,
				})
				continue
			}
			// otherwise, add all the text versions
			for (const version of slot.variants) {
				const item: StaticLayoutMeta = {
					type: slot.type,
					text: version.text,
					priority: version.priority,
					slotIndex: this._slots.indexOf(slot),
				}
				metaItems.push(item)
			}
		}
		return metaItems
	}

	private combineMetaAndSlot(meta: StaticLayoutMeta, slot: StaticLayoutSlot) {
		// get the item
		let item: StaticLayoutItem | undefined = undefined

		if (meta.type === 'text') {
			const textSlot = slot as StaticLayoutSlotText
			item = {
				type: 'text',
				text: meta.text,
				font: textSlot.font ?? this._defaultFont,
				fontSize: textSlot.fontSize ?? this._defaultFontSize,
				color: textSlot.color ?? this._defaultColor,
				width: undefined,
			}
			item.width = getTextWidth(item.text, item.fontSize)
		} else if (meta.type === 'icon') {
			const iconSlot = slot as StaticLayoutSlotIcon
			item = {
				type: 'icon',
				icon: meta.icon,
				size: iconSlot.size,
				color: iconSlot.color ?? this._defaultColor,
				width: iconSlot.size,
			}
		}

		return item
	}
}
