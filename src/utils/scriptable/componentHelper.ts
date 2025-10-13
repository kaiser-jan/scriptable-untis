import { MAX_TIME_STRING } from '@/constants'
import { colors, getColor } from '@/settings/colors'
import { Settings } from '@/settings/settings'
import { LessonState } from '@/types/api'
import { TransformedLesson } from '@/types/transformed'
import { asNumericTime, getCharHeight, getCharWidth, getTextWidth } from '../helper'
import { getSubjectTitle } from '../lessonHelper'

/**
 * Adds a SFSymbol with the correct outer size to match the font size.
 */
export function addSymbol(
	name: string,
	to: WidgetStack | ListWidget,
	options: { color: Color; size: number; outerSize?: number }
) {
	const icon = SFSymbol.named(name)
	icon.applyFont(Font.mediumSystemFont(options.size))
	const iconImage = to.addImage(icon.image)
	const outerSize = options.outerSize ?? getCharHeight(options.size)
	iconImage.imageSize = new Size(outerSize, outerSize)
	iconImage.resizable = false
	iconImage.tintColor = options.color
	return iconImage
}

/**
 * Adds a break to the widget.
 */
export function addBreak(
	to: WidgetStack | ListWidget,
	breakFrom: Date,
	breakTo: Date,
	showToTime: boolean,
	widgetConfig: Settings
) {
	// Liquid Glass
        const __liquidItemColors = getItemColors(colors.background.primary, widgetConfig, false)
	const breakContainer = makeTimelineEntry(to, breakFrom, widgetConfig, {
		backgroundColor: __liquidItemColors.backgroundColor,
		showTime: true,
		showToTime: showToTime,
		toTime: breakTo,
	})
			
        breakContainer.cornerRadius = widgetConfig.appearance.cornerRadius

	const breakTitle = breakContainer.addText('Break')
	breakTitle.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
	breakTitle.textColor = __liquidItemColors.secondaryTextColor
	breakContainer.addSpacer()
}

/**
 * Creates a "timeline entry" which is a container (you can add content to) with the time on the left.
 * @param to the container to add the entry to
 * @param time the from time of the entry
 * @param widgetConfig
 * @param options additional widgetConfig
 * @returns the first stack of the entry, which can be used to add content
 */
function makeTimelineEntry(
	to: WidgetStack | ListWidget,
	time: Date,
	widgetConfig: Settings,
	options: {
		showTime?: boolean
		showToTime?: boolean
		toTime?: Date
		backgroundColor?: Color
	} = { showTime: true }
) {
	const padding = 4

	const lessonWrapper = to.addStack()
	lessonWrapper.layoutHorizontally()
	lessonWrapper.spacing = widgetConfig.appearance.spacing

	const lessonContainer = lessonWrapper.addStack()
	lessonContainer.backgroundColor = options.backgroundColor
	lessonContainer.layoutHorizontally()
	lessonContainer.setPadding(padding, padding, padding, padding)
	lessonContainer.cornerRadius = widgetConfig.appearance.cornerRadius

	if (options.showTime) {
		const timeWrapper = lessonWrapper.addStack()
		timeWrapper.backgroundColor = options.backgroundColor
		timeWrapper.setPadding(padding, padding, padding, padding)
		timeWrapper.cornerRadius = widgetConfig.appearance.cornerRadius
		timeWrapper.size = new Size(
			getTextWidth(MAX_TIME_STRING, widgetConfig.appearance.fontSize) + 2 * padding,
			getCharHeight(widgetConfig.appearance.fontSize) + 2 * padding
		)

		const timeText = timeWrapper.addDate(new Date(time))
		timeText.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
		timeText.textColor = colors.text.primary
		timeText.rightAlignText()
		timeText.applyTimeStyle()

		if (options.showToTime) {
			const timeToWrapper = lessonWrapper.addStack()
			timeToWrapper.backgroundColor = options.backgroundColor
			timeToWrapper.setPadding(padding, padding, padding, padding)
			timeToWrapper.cornerRadius = widgetConfig.appearance.cornerRadius
			timeToWrapper.size = new Size(
				getTextWidth(MAX_TIME_STRING, widgetConfig.appearance.fontSize) + 2 * padding,
				getCharHeight(widgetConfig.appearance.fontSize) + 2 * padding
			)

			const timeToText = timeToWrapper.addDate(new Date(options.toTime))
			timeToText.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
			timeToText.textColor = colors.text.primary
			timeToText.rightAlignText()
			timeToText.applyTimeStyle()
		}
	}

	return lessonContainer
}

function getLessonColors(lesson: TransformedLesson, widgetConfig: Settings) {
	/** Whether the lesson was rescheduled away from here. (isSource)
	 * The lesson state seems to be CANCELED? */
	const isRescheduledAway = lesson.rescheduleInfo?.isSource

	// define the colors
	let backgroundColor = getColor(lesson.backgroundColor)
	let textColor = colors.text.primary
	let secondaryTextColor = colors.text.secondary

	if (lesson.state === LessonState.FREE || isRescheduledAway) {
		backgroundColor = colors.background.primary
		textColor = colors.text.disabled
		secondaryTextColor = colors.text.disabled
	}
	// only make it red if it's canceled
	else if (lesson.state === LessonState.CANCELED) {
		backgroundColor = colors.background.primary
		textColor = colors.text.red
		secondaryTextColor = colors.text.red
	}

	// Liquid Glass override
    	try {
            const liquid = !!(widgetConfig && widgetConfig.appearance && widgetConfig.appearance.liquidGlass)
            if (liquid) {
                // For normal lessons use a slight translucent overlay that adapts to appearance:
                // light appearance white 30% overlay, dark appearance black 30% overlay
                if (lesson.state !== LessonState.CANCELED && lesson.state !== LessonState.FREE && !isRescheduledAway) {
                    backgroundColor = Color.dynamic(new Color('#ffffff', 0.30), new Color('#000000', 0.30))
                    // Ensure high contrast text colors
                    textColor = Color.dynamic(new Color('#000000'), new Color('#ffffff'))
                    secondaryTextColor = Color.dynamic(new Color('#666666'), new Color('#999999'))
                } else {
                    // For cancelled/free/rescheduled keep disabled look but ensure contrast
                    textColor = colors.text.disabled
                    secondaryTextColor = colors.text.disabled
                    backgroundColor = colors.background.primary
                }
            }
        } catch (e) {
            // if something fails, fall back to default colors
            console.warn('Liquid Glass override failed: ' + e)
        }

	return { backgroundColor, textColor, secondaryTextColor }
}

/**
 * Generic color helper that applies the Liquid Glass override when enabled.
 * baseBackgroundColor: the original background color that would have been used (may be null)
 * widgetConfig: the widget configuration object
 * disabled: whether the item should be shown as disabled (uses disabled text/background)
 */
export function getItemColors(baseBackgroundColor: Color, widgetConfig: Settings, disabled = false) {
    let backgroundColor = baseBackgroundColor ?? colors.background.primary
    let textColor = colors.text.primary
    let secondaryTextColor = colors.text.secondary
    if (disabled) {
        backgroundColor = colors.background.primary
        textColor = colors.text.disabled
        secondaryTextColor = colors.text.disabled
    }
    // Liquid Glass override (same approach as lessons)
    try {
        const liquid = !!(widgetConfig && widgetConfig.appearance && widgetConfig.appearance.liquidGlass)
        if (liquid && !disabled) {
            // translucent overlay that adapts to appearance
            backgroundColor = Color.dynamic(new Color('#ffffff', 0.30), new Color('#000000', 0.30))
            // high contrast text colors
            textColor = Color.dynamic(new Color('#000000'), new Color('#ffffff'));
            secondaryTextColor = Color.dynamic(new Color('#666666'), new Color('#999999'))
        }
    } catch (e) {
        console.warn('getItemColors Liquid Glass override failed: ' + e)
    }
    return { backgroundColor, textColor, secondaryTextColor }
}

function isColorLight(hex: any) {
  try {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  } catch {
    return false;
  }
}

export function getReadableTextColor(bgColor: Color) {
  const hex = (bgColor && typeof bgColor.hex === "string") ? bgColor.hex : (typeof bgColor === "string" ? bgColor : "#000000");
  return isColorLight(hex) ? Color.black() : Color.white();
}

/**
 * Adds a lesson to the widget. This includes its subject, additional info (as an icon) and the time.
 * The state is also shown as through colors. (canceled, event)
 * @param lesson the lesson to add
 * @param to the container to add the lesson to
 * @param widgetConfig
 * @param options
 */
export function addWidgetLesson(
	lesson: TransformedLesson,
	to: ListWidget | WidgetStack,
	widgetConfig: Settings,
	options: {
		showTime: boolean
		showToTime: boolean
		useSubjectLongName: boolean
	} = {
		showTime: true,
		showToTime: false,
		useSubjectLongName: false,
	}
) {
	const widgetFamily = config.widgetFamily || "medium";
    const isSmall = widgetFamily === "small";
  
    const { backgroundColor, textColor, secondaryTextColor } = getLessonColors(lesson, widgetConfig);
    const readableTextColor = getReadableTextColor(backgroundColor);
    const readableSecondary = isColorLight(backgroundColor) ? Color.dynamic(Color.gray(), Color.lightGray()) : colors.text.secondary;

    const lessonContainer = makeTimelineEntry(to, lesson.from, widgetConfig, {
        showTime: options.showTime,
        showToTime: options.showToTime,
        toTime: lesson.to,
        backgroundColor: backgroundColor,
    });
    lessonContainer.spacing = widgetConfig.appearance.spacing;

    // dynamic font Size
    const fontSize = isSmall ? widgetConfig.appearance.fontSize * 0.85 : widgetConfig.appearance.fontSize;

    // subject name
    const subjectTitle = getSubjectTitle(lesson, options.useSubjectLongName);
    const lessonText = lessonContainer.addText(subjectTitle);
    lessonText.font = Font.semiboldSystemFont(fontSize);
    lessonText.textColor = readableTextColor;
    lessonText.lineLimit = isSmall ? 1 : 2;
    lessonText.minimumScaleFactor = 0.5;
    lessonText.leftAlignText();

    // show teacher + room only in medium or big widget
    if (!isSmall && lesson.rooms?.length) {
        const roomNames = lesson.rooms.map(r => r.name).join(", ");
        const roomText = lessonContainer.addText(" • " + roomNames);
        roomText.font = Font.mediumSystemFont(fontSize * 0.9);
        roomText.textColor = readableSecondary;
        roomText.lineLimit = 1;
        roomText.minimumScaleFactor = 0.7;
    }

    if (!isSmall && lesson.teachers?.length) {
        const teacherNames = lesson.teachers.map(t => t.longName || t.name).join(", ");
        const teacherText = lessonContainer.addText(" • " + teacherNames + " • ");
        teacherText.font = Font.regularSystemFont(fontSize * 0.9);
        teacherText.textColor = readableSecondary;
        teacherText.leftAlignText();
    }

    if (lesson.duration > 1 && widgetConfig.views.lessons.showMultiplier) {
        const durationText = lessonContainer.addText(`x${lesson.duration}`);
        durationText.font = Font.mediumSystemFont(fontSize);
        durationText.textColor = readableSecondary;
    }

    let iconName;
    const STATE_ICON_MAP = {
        STANDARD: undefined,
        CANCEL: 'xmark.circle',
        FREE: 'xmark.circle',
        ADDITIONAL: 'plus.circle',
        SHIFT: 'calendar.circle',
        EXAM: 'book.circle',
        SUBSTITUTION: 'person.circle',
        TEACHERSUBSTITUTION: 'person.circle',
        ROOMSUBSTITUTION: 'location.circle',
    };

    if (lesson.isEvent) iconName = 'calendar.circle';
    else if (lesson.rescheduleInfo?.isSource);
    else iconName = STATE_ICON_MAP[lesson.state];

    if (iconName) {
        lessonContainer.addSpacer();
        addSymbol(iconName, lessonContainer, { color: secondaryTextColor, size: fontSize });
    }
}

/**
 * Fills/transforms the given container with the given lesson information.
 * @param lesson
 * @param container
 * @param widgetConfig
 */
export function fillContainerWithSubject(lesson: TransformedLesson, container: WidgetStack, widgetConfig: Settings) {
	const { backgroundColor, textColor, secondaryTextColor } = getLessonColors(lesson, widgetConfig)

	container.backgroundColor = backgroundColor
	container.layoutHorizontally()
	container.setPadding(4, 4, 4, 4)
	container.cornerRadius = widgetConfig.appearance.cornerRadius
	container.spacing = widgetConfig.appearance.spacing

	// add the name of the subject
	const subjectText = container.addText(getSubjectTitle(lesson))
	subjectText.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
	subjectText.textColor = textColor
	subjectText.leftAlignText()
	subjectText.minimumScaleFactor = 1
	subjectText.lineLimit = 1

	// add a x2 for double lessons etc.
	if (widgetConfig.views.lessons.showMultiplier && lesson.duration > 1) {
		const durationText = container.addText(`x${lesson.duration}`)
		durationText.font = Font.mediumSystemFont(widgetConfig.appearance.fontSize)
		durationText.textColor = colors.text.secondary
	}
}

	
/**
 * Remove homework that is past its due date (next midnight after due date)
 * @param {Array} homeworks - Current homework list from Untis
 * @returns {Array} - Filtered list (expired ones removed)
 */
export function cleanupExpiredHomeworks(homeworks) {
  const now = new Date();
  const cleaned = [];
  for (const hw of homeworks) {
    const due = hw.dueDate ?? hw.date;
    if (!due) {
      cleaned.push(hw);
      continue;
    }
    // Compute expiration = start of next day after due date
    const expiration = new Date(due);
    expiration.setDate(expiration.getDate() + 1);
    expiration.setHours(0, 0, 0, 0);
    // Keep if not expired
    if (now < expiration) {
      cleaned.push(hw);
    } else {
      console.log(`🗑️ Removing expired homework: ${hw.text || hw.subject || hw.id}`);
    }
  }
  return cleaned;
}