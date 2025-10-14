import { loadHomeworkStates, saveHomeworkStates } from '@/utils/scriptable/fileSystem'

// Early exit for toggleHomework
function handleToggle() {
  if (args.queryParameters.toggleHomework) {
    const id = args.queryParameters.toggleHomework
    const states = loadHomeworkStates()
    states[id] = !states[id]
    saveHomeworkStates(states)
    try { App.close() } catch(e) {}
    Script.complete()
    return
  }
}
handleToggle()

import { LOCALE } from '@/constants'
import { colors } from '@/settings/colors'
import { TransformedHomework } from '@/types/transformed'
import { Duration, DurationUnit } from '@/utils/duration'
import { getCharHeight, getTextWidth } from '@/utils/helper'
import { getReadableTextColor } from '@/utils/scriptable/componentHelper'
import { ViewBuildData } from '@/widget'
import { HomeworkViewConfig } from '@/types/settings'

export function addViewHomeworks(
    homeworks: TransformedHomework[],
    maxCount: number,
    { container, width, height, widgetConfig }: ViewBuildData
) {
  if (!Array.isArray(homeworks) || homeworks.length === 0) return 0;

  const states = loadHomeworkStates();
  const { appearance } = widgetConfig;
  const hwCfg: HomeworkViewConfig = widgetConfig.views?.homeworks ?? {}
  const compact = hwCfg.enableCompactMode ?? false;
  const warningDaysSeconds = hwCfg.dueWarningDays ?? Duration.asSeconds(2, DurationUnit.DAY);
  const overdueDaysSeconds = hwCfg.dueOverdueDays ?? Duration.asSeconds(0, DurationUnit.DAY);
  const dueWarningColor = hwCfg.dueWarningColor ?? "#ffd60a";
  const dueOverdueColor = hwCfg.dueOverdueColor ?? "#ff453a";
  const liquidGlass = appearance?.liquidGlass ?? false;

  const now = new Date();
  const sorted = [...homeworks].sort((a, b) => {
    const at = a.dueDate ? a.dueDate.getTime() : (a.date ? a.date.getTime() : 0);
    const bt = b.dueDate ? b.dueDate.getTime() : (b.date ? b.date.getTime() : 0);
    return at - bt;
  });

  const neutralBg = liquidGlass
    ? Color.dynamic(new Color("#ffffff", 0.18), new Color("#000000", 0.18))
    : colors.background.primary;

  const baseSizes = {
    paddingV: 8,
    paddingH: 10,
    iconSize: 18,
    circleSize: 22,
    maxTitleFont: 12,
    minTitleFont: 7,
    subFont: Math.max(12, appearance.fontSize),
    titleFont: Math.max(appearance.fontSize, appearance.fontSize + 1)
  };
  const compactWidth = 0.48;
  const S = { ...baseSizes, widthFactor: compact ? compactWidth : 1.0 };

  const charHeight = getCharHeight(appearance.fontSize);
  const itemHeight = Math.ceil(charHeight * 1.8) + S.paddingV * 2;
  const itemSpacing = widgetConfig.appearance.spacing ?? 6;

  let count = 0;
  let lastRowStack = null;

  for (const hw of sorted) {
    if (maxCount && count >= maxCount) break;

    let rowStack;
    if (compact) {
      if (count % 2 === 0) {
        if (count > 0) container.addSpacer(itemSpacing);
        rowStack = container.addStack();
        rowStack.layoutHorizontally();
        rowStack.spacing = 8;
        lastRowStack = rowStack;
      } else {
        rowStack = lastRowStack || container;
      }
    } else {
      if (count > 0) container.addSpacer(itemSpacing);
      rowStack = container.addStack();
      rowStack.layoutHorizontally();
      rowStack.centerAlignContent();
    }

    const done = (states[hw.id] ?? hw.completed) ?? false;
    const due = hw.dueDate ?? hw.date;
    const diffSec = due ? (due.getTime() - now.getTime()) / 1000 : 999999;
    let dueColor;
    if (done) dueColor = "#888888";
    else if (diffSec < overdueDaysSeconds) dueColor = dueOverdueColor;
    else if (diffSec <= warningDaysSeconds) dueColor = dueWarningColor;
    else dueColor = "#30d158";

    const hwContainer = rowStack.addStack();
    hwContainer.layoutHorizontally();
    hwContainer.centerAlignContent();
    hwContainer.setPadding(S.paddingV, S.paddingH, S.paddingV, S.paddingH);
    hwContainer.cornerRadius = appearance.cornerRadius;
    hwContainer.backgroundColor = neutralBg;
    hwContainer.url = `scriptable:///run?scriptName=UntisWidget_v5&toggleHomework=${hw.id}`;

    if (compact) {
      const availableW = (width - 3 * itemSpacing) / 2;
      hwContainer.size = new Size(availableW, 0);
    }

    const left = hwContainer.addStack();
    left.size = new Size(S.circleSize, S.circleSize);
    left.centerAlignContent();
    left.cornerRadius = S.circleSize / 2;

    if (done) {
      if (!liquidGlass) left.backgroundColor = new Color("#30d158");
      const chk = SFSymbol.named("checkmark");
      chk.applyFont(Font.systemFont(Math.floor(S.iconSize * 0.65)));
      const chkImg = left.addImage(chk.image);
      chkImg.tintColor = liquidGlass ? new Color("#30d158") : Color.white();
      chkImg.imageSize = new Size(Math.floor(S.iconSize * 0.55), Math.floor(S.iconSize * 0.55));
    } else {
      const circ = SFSymbol.named("circle");
      circ.applyFont(Font.systemFont(Math.floor(S.iconSize * 0.9)));
      const circImg = left.addImage(circ.image);
      circImg.tintColor = new Color("#888888");
      circImg.imageSize = new Size(Math.floor(S.iconSize * 0.9), Math.floor(S.iconSize * 0.9));
    }

    hwContainer.addSpacer(6);

    const textStack = hwContainer.addStack();
    textStack.layoutVertically();
    textStack.centerAlignContent();

    const subjCfg = widgetConfig.subjects?.[hw.subject];
    const shortName = subjCfg?.nameOverride ?? hw.subject ?? "?";

    if (compact) {
      const subjText = textStack.addText(shortName);
      subjText.font = Font.mediumSystemFont(S.subFont - 2);
      subjText.textColor = done 
  ? new Color("#888888") 
  : new Color(widgetConfig.subjects?.[hw.subject]?.color ?? "#aaaaaa");
      subjText.lineLimit = 1;
    }

    const titleText = hw.text?.trim() || "Task";
    let fontSize = S.maxTitleFont;
    const reservedRightWidth = S.circleSize + 8;
    const availableWidth = Math.max(60, Math.floor((width * S.widthFactor) - S.paddingH * 2 - reservedRightWidth - S.circleSize - 8));
    const avgCharWidth = fontSize * 0.55;
    const estWidth = titleText.length * avgCharWidth;
    if (estWidth > availableWidth) {
      const scale = Math.max(0.7, availableWidth / estWidth);
      fontSize = Math.max(S.minTitleFont, Math.floor(fontSize * scale));
    }

    const title = textStack.addText(titleText);
    title.font = Font.semiboldSystemFont(compact ? fontSize : S.titleFont);
    title.textColor = done ? new Color("#888888") : getReadableTextColor(neutralBg);
    title.lineLimit = compact ? 1 : 2;
    title.minimumScaleFactor = 0.6;

    if (!compact) {
      const subjLineStack = textStack.addStack();
      subjLineStack.layoutHorizontally();
      subjLineStack.centerAlignContent();
      subjLineStack.spacing = 6;

      if (hw.subject) {
        const shortName = subjCfg?.nameOverride ?? hw.subject;
        const longName = subjCfg?.longNameOverride ?? shortName;
        const maxWidth = width - 80;
        const longWidth = getTextWidth(longName, S.subFont);
        const subjTitle = longWidth < maxWidth ? longName : shortName;

        let subjHex = subjCfg?.color ?? subjCfg ?? "#aaaaaa";
        let subjTextColor = subjCfg?.textColor ?? null;
        try {
          if (typeof subjHex === "object") subjHex = subjHex.color ?? "#aaaaaa";
          const subjColorObj = new Color(subjHex);
          const subjColorToUse = done ? new Color("#888888") : subjColorObj;
          const subj = subjLineStack.addText(subjTitle);
          subj.font = Font.systemFont(S.subFont);
          subj.textColor = subjTextColor ? new Color(subjTextColor) : subjColorToUse;
        } catch (e) {
          const subj = subjLineStack.addText(subjTitle);
          subj.font = Font.systemFont(S.subFont);
          subj.textColor = new Color(done ? "#888888" : "#aaaaaa");
        }
      }

      if (hw.teacher) {
        const sep1 = subjLineStack.addText("•");
        sep1.font = Font.systemFont(S.subFont);
        sep1.textColor = new Color("#888888");
        const teacher = subjLineStack.addText(hw.teacher);
        teacher.font = Font.systemFont(S.subFont);
        teacher.textColor = new Color("#888888");
      }

      if (due) {
        const sep2 = subjLineStack.addText("•");
        sep2.font = Font.systemFont(S.subFont);
        sep2.textColor = new Color("#888888");
        const dueText = subjLineStack.addText(due.toLocaleDateString(LOCALE, { day: "2-digit", month: "short" }));
        dueText.font = Font.systemFont(S.subFont);
        dueText.textColor = done ? new Color("#888888") : new Color(dueColor);
      }
    }

    hwContainer.addSpacer();

    if (!done) {
      if (compact && dueColor !== "#30d158") {
        const alert = hwContainer.addStack();
        alert.size = new Size(S.circleSize * 0.8, S.circleSize * 0.8);
        alert.cornerRadius = S.circleSize / 2;
        alert.centerAlignContent();
        if (!liquidGlass) alert.backgroundColor = new Color(dueColor);
        const exTxt = alert.addText("!");
        exTxt.font = Font.boldSystemFont(Math.max(8, Math.floor(S.iconSize * 0.8)));
        exTxt.textColor = liquidGlass ? new Color(dueColor) : Color.white();
      } else if (!compact && dueColor !== "#30d158") {
        const alert = hwContainer.addStack();
        alert.size = new Size(S.circleSize, S.circleSize);
        alert.cornerRadius = S.circleSize / 2;
        alert.centerAlignContent();
        if (!liquidGlass) alert.backgroundColor = new Color(dueColor);
        const exTxt = alert.addText("!");
        exTxt.font = Font.boldSystemFont(Math.max(10, Math.floor(S.iconSize * 0.9)));
        exTxt.textColor = liquidGlass ? new Color(dueColor) : Color.white();
      }
    }

    count++;
  }

  let usedHeight;
  if (compact) {
    const rows = Math.ceil(count / 2);
    usedHeight = rows * itemHeight + Math.max(0, rows - 1) * itemSpacing;
  } else {
    usedHeight = count * itemHeight + Math.max(0, count - 1) * itemSpacing;
  }
  usedHeight = Math.min(usedHeight, height);
  return Math.max(0, Math.floor(usedHeight));
}