import { PREVIEW_WIDGET_SIZE } from '@/constants'
import { ErrorCode, createError } from '../errors'

interface HomescreenWidgetSizes {
	small: Size
	medium: Size
	large: Size
	extraLarge?: Size
}

type WidgetSizesList = Map<string, HomescreenWidgetSizes>

/**
 * @link https://developer.apple.com/design/human-interface-guidelines/widgets#Specifications
 */
export function getWidgetSizes() {
	const phoneSizes: WidgetSizesList = new Map([
		['430x932', { small: new Size(170, 170), medium: new Size(364, 170), large: new Size(364, 382) }],
		['428x926', { small: new Size(170, 170), medium: new Size(364, 170), large: new Size(364, 382) }],
		['414x896', { small: new Size(169, 169), medium: new Size(360, 169), large: new Size(360, 379) }],
		['414x736', { small: new Size(159, 159), medium: new Size(348, 157), large: new Size(348, 357) }],
		['402x874', { small: new Size(158, 158), medium: new Size(338, 158), large: new Size(338, 354) }],
		['393x852', { small: new Size(158, 158), medium: new Size(338, 158), large: new Size(338, 354) }],
		['390x844', { small: new Size(158, 158), medium: new Size(338, 158), large: new Size(338, 354) }],
		['375x812', { small: new Size(155, 155), medium: new Size(329, 155), large: new Size(329, 345) }],
		['375x667', { small: new Size(148, 148), medium: new Size(321, 148), large: new Size(321, 324) }],
		['360x780', { small: new Size(155, 155), medium: new Size(329, 155), large: new Size(329, 345) }],
		['320x568', { small: new Size(141, 141), medium: new Size(292, 141), large: new Size(292, 311) }],
	])

	const padSizes: WidgetSizesList = new Map([
		[
			'768x1024',
			{
				small: new Size(141, 141),
				medium: new Size(305.5, 141),
				large: new Size(305.5, 305.5),
				extraLarge: new Size(634.5, 305.5),
			},
		],
		[
			'744x1133',
			{
				small: new Size(141, 141),
				medium: new Size(305.5, 141),
				large: new Size(305.5, 305.5),
				extraLarge: new Size(634.5, 305.5),
			},
		],
		[
			'810x1080',
			{
				small: new Size(146, 146),
				medium: new Size(320.5, 146),
				large: new Size(320.5, 320.5),
				extraLarge: new Size(669, 320.5),
			},
		],
		[
			'820x1180',
			{
				small: new Size(155, 155),
				medium: new Size(342, 155),
				large: new Size(342, 342),
				extraLarge: new Size(715.5, 342),
			},
		],
		[
			'834x1112',
			{
				small: new Size(150, 150),
				medium: new Size(327.5, 150),
				large: new Size(327.5, 327.5),
				extraLarge: new Size(682, 327.5),
			},
		],
		[
			'834x1194',
			{
				small: new Size(155, 155),
				medium: new Size(342, 155),
				large: new Size(342, 342),
				extraLarge: new Size(715.5, 342),
			},
		],
		[
			'954x1373',
			{
				small: new Size(162, 162),
				medium: new Size(350, 162),
				large: new Size(350, 350),
				extraLarge: new Size(726, 350),
			},
		],
		[
			'970x1389',
			{
				small: new Size(162, 162),
				medium: new Size(350, 162),
				large: new Size(350, 350),
				extraLarge: new Size(726, 350),
			},
		],
		[
			'1024x1366',
			{
				small: new Size(170, 170),
				medium: new Size(378.5, 170),
				large: new Size(378.5, 378.5),
				extraLarge: new Size(795, 378.5),
			},
		],
		[
			'1192x1590',
			{
				small: new Size(188, 188),
				medium: new Size(412, 188),
				large: new Size(412, 412),
				extraLarge: new Size(860, 412),
			},
		],
	])

	const deviceSize = Device.screenSize()

	const deviceSizeString = `${deviceSize.width}x${deviceSize.height}`
	// for rotated devices, the width and height are swapped
	const alternativeDeviceSizeString = `${deviceSize.height}x${deviceSize.width}`

	const widgetSizes =
		phoneSizes.get(deviceSizeString) ??
		phoneSizes.get(alternativeDeviceSizeString) ??
		padSizes.get(deviceSizeString) ??
		padSizes.get(alternativeDeviceSizeString)

	if (!widgetSizes) {
		console.warn(`Unsupported ${Device.isPad() ? 'pad' : 'phone'} with size ${deviceSize}!`)
		throw createError(ErrorCode.UNSUPPORTED_DEVICE_RESOLUTION)
	}

	console.log(`Widget sizes for device with size ${JSON.stringify(deviceSize)}: ${JSON.stringify(widgetSizes)}`)
	return widgetSizes
}

/**
 * Returns the widget size for the current widget family and device.
 */
export function getWidgetSize(widgetSizes: HomescreenWidgetSizes, widgetFamily?: typeof config.widgetFamily): Size {
	// return a placeholder if the widget size is not defined
	if (widgetSizes === undefined) {
		return new Size(0, 0)
	}

	// return small widget size if the widget family is not set
	if (!widgetFamily) {
		console.log(`Defaulting to ${PREVIEW_WIDGET_SIZE} widget size`)
		return widgetSizes[PREVIEW_WIDGET_SIZE]
	}

	if (isHomescreenWidgetSize(widgetFamily, widgetSizes)) {
		return widgetSizes[widgetFamily] ?? new Size(0, 0)
	}

	return new Size(0, 0)
}

function isHomescreenWidgetSize(k: string, widgetSizes: HomescreenWidgetSizes): k is keyof typeof widgetSizes {
	return k in widgetSizes
}
