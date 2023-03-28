
export const unparsedColors = {
	background: {
		primary: '#222629',
		red: '#461E1E',
		orange: '#4E2B03',
		yellow: '#544318',
		lime: '#354611',
		green: '#234010',
		darkGreen: '#1F3221',
		turquoise: '#114633',
		lightBlue: '#0E4043',
		blue: '#222B4A',
		lavender: '#33254F',
		purple: '#3F2156',
		pink: '#4A183F',
		brown: '#37291B',
	},
	text: {
		primary: '#E0EAEF',
		secondary: '#A7B4B8',
		disabled: '#687277',
		red: '#BA4747',
		event: '#DD9939',
	},
}

type UnparsedColors = typeof unparsedColors
type Colors = { [key in keyof UnparsedColors]: { [nestedKey in keyof UnparsedColors[key]]: Color } }

function parseColors(input: UnparsedColors): Colors {
	// go through the colors and parse them
	const colors: any = {}
	for (const key in input) {
		colors[key] = {} as any
		const values = input[key as keyof UnparsedColors]
		for (const nestedKey in values) {
			colors[key][nestedKey] = new Color(values[nestedKey as keyof typeof values])
		}
	}

	return colors
}

export const colors = parseColors(unparsedColors)

export function getColor(name: string) {
	if (!(name in colors.background)) {
		// check if it is a hex color
		if (/^#?([\da-f]{3}){1,2}$/i.test(name)) {
			return new Color(name)
		}
		console.log(`Color ${name} not found`)
		return colors.background.primary
	}
	return new Color(unparsedColors.background[name as keyof typeof unparsedColors.background])
}
