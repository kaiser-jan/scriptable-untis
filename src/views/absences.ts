import { LOCALE } from '@/constants'
import { colors } from '@/settings/colors'
import { TransformedAbsence } from '@/types/transformed'
import { Duration } from '@/utils/duration'
import { getCharHeight } from '@/utils/helper'
import { StaticLayoutRow } from '@/utils/scriptable/layout/staticLayoutRow'
import { ViewBuildData } from '@/widget'
import { getItemColors } from '@/utils/scriptable/componentHelper'

export function addViewAbsences(
	absences: TransformedAbsence[],
	maxCount: number,
	{ container, width, height, widgetConfig }: ViewBuildData
) {
  let remainingHeight = height
  const baseFontSize = widgetConfig.appearance.fontSize
  const charHeight = getCharHeight(baseFontSize)
  const padding = 4
  const singleLineHeight = charHeight + 2 * padding
  const detailFontSize = Math.max(9, baseFontSize - 1)
  const detailCharHeight = getCharHeight(detailFontSize)
  if (height < singleLineHeight) return 0

  // Sort: unexcused first, newest first
  const sorted = absences.sort((a, b) => {
    if (a.isExcused !== b.isExcused) return a.isExcused ? 1 : -1
    return b.from.getTime() - a.from.getTime()
  })

  let shown = 0
  for (const absence of sorted) {
    const hasDetail = !!(absence.reason || absence.text)
    const itemHeight = singleLineHeight + (hasDetail ? detailCharHeight + 2 : 0)
    if (itemHeight > remainingHeight) break

    const stack = container.addStack()
    stack.layoutVertically()
    stack.setPadding(padding, padding, padding, padding)
    stack.spacing = 1
    stack.cornerRadius = widgetConfig.appearance.cornerRadius

    const isExcused = absence.isExcused
    const colorset = getItemColors(colors.background.primary, widgetConfig, false)
    stack.backgroundColor = isExcused
      ? Color.dynamic(new Color("#003300", 0.25), new Color("#003300", 0.35))
      : Color.dynamic(new Color("#330000", 0.25), new Color("#330000", 0.35))
    stack.opacity = isExcused ? 0.6 : 1.0

    // Row 1: Icon + date/time/duration + teacher
    const row1 = stack.addStack()
    row1.layoutHorizontally()
    row1.centerAlignContent()
    row1.spacing = widgetConfig.appearance.spacing

    const staticLayout = new StaticLayoutRow(
      width - 2 * padding,
      widgetConfig.appearance.spacing,
      Font.mediumSystemFont(baseFontSize),
      baseFontSize,
      colorset.textColor
    )

    const day = absence.from.toLocaleDateString(LOCALE, { weekday: "short" })
    const dateStr = absence.from.toLocaleDateString(LOCALE, { day: "2-digit", month: "short" })
    const fromStr = absence.from.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" })
    const toStr = absence.to.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" })
    const durationMs = absence.to.getTime() - absence.from.getTime()
    const durationStr = Duration.fromSeconds(durationMs / 1000).toString()

    const icon = isExcused ? "checkmark.circle.fill" : "exclamationmark.circle.fill"
    const iconColor = isExcused ? new Color("#00cc66") : new Color("#ff3b30")
    staticLayout.addItem({ type: "icon", icon, size: baseFontSize, color: iconColor, priority: 1 })

    staticLayout.addItem({
      type: "text",
      color: colorset.textColor,
      variants: [
        { text: `${day}, ${dateStr} ${fromStr}-${toStr} (${durationStr})`, priority: 2 },
      ],
    })

    if (absence.createdBy) {
      staticLayout.addItem({
        type: "text",
        color: colorset.secondaryTextColor,
        variants: [{ text: absence.createdBy, priority: 3 }],
      })
    }

    staticLayout.build(row1)

    // --- Row 2: reason + text ---
    if (hasDetail) {
      const row2 = stack.addStack()
      row2.layoutHorizontally()
      row2.centerAlignContent()
      row2.spacing = 3

      const reasonText = absence.reason?.trim() ?? ""
      const detailText = absence.text?.trim() ?? ""
      const combined = reasonText && detailText ? `${reasonText} • ${detailText}` : reasonText || detailText

      const txt = row2.addText(combined)
      txt.font = Font.systemFont(detailFontSize)
      txt.textColor = colorset.secondaryTextColor
      txt.lineLimit = 2
      txt.minimumScaleFactor = 0.8
    }

    remainingHeight -= itemHeight
    shown++
    if (shown >= maxCount) break
    if (singleLineHeight + widgetConfig.appearance.spacing > remainingHeight) break
  }

  return height - remainingHeight
}