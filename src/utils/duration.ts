export enum DurationUnit {
	SECOND = 's',
	MINUTE = 'min',
	HOUR = 'h',
	DAY = 'd',
	WEEK = 'wk',
	MONTH = 'mo',
	YEAR = 'yr',
}

const durationUnitMultipliers = {
	[DurationUnit.SECOND]: 1,
	[DurationUnit.MINUTE]: 60,
	[DurationUnit.HOUR]: 60 * 60,
	[DurationUnit.DAY]: 60 * 60 * 24,
	[DurationUnit.WEEK]: 60 * 60 * 24 * 7,
	[DurationUnit.MONTH]: 60 * 60 * 24 * 30,
	[DurationUnit.YEAR]: 60 * 60 * 24 * 365,
}

const durationUnitMaxima = {
    [DurationUnit.SECOND]: 300,
    [DurationUnit.MINUTE]: 300,
    [DurationUnit.HOUR]: 48,
    [DurationUnit.DAY]: 30,
    [DurationUnit.WEEK]: 12,
    [DurationUnit.MONTH]: 24,
    [DurationUnit.YEAR]: Number.MAX_VALUE,
}


export class Duration {
	private seconds: number

	constructor(value: number, unit: DurationUnit) {
		this.seconds = value * durationUnitMultipliers[unit]
	}

	public static fromString(value: string): Duration {
        // parse the value using a regex, allow decimal places
        const match = value.match(/^(\d+(?:\.\d+)?)\s*(s|min|h|d|wk|mo|yr)$/)
        if (match) {
            const [, number, unit] = match
            return new Duration(parseFloat(number), unit as DurationUnit)
        }

		throw new Error(`Invalid duration: ${value}`)
	}

	public static fromSeconds(value: number): Duration {
		return new Duration(value, DurationUnit.SECOND)
	}

	/**
	 * Converts the duration to a human readable string.
	 * The following rules are used:
	 * 1. The largest unit, where the value is still greater than 1, is used.
	 * 2. If the number would have more than 2 decimal places, a smaller unit is used.
	 * 3. However, the number should not be larger than the maximum value for the unit.
	 */
	public toString(): string {
		// the units from largest to smallest
		const units = Object.values(DurationUnit).reverse()

		// find the largest unit, where the value is still greater than 1
		// iterate using the index, so we can access the previous unit
		for (let i = 0; i < units.length; i++) {
			const unit = units[i]
			const value = this.seconds / durationUnitMultipliers[unit]

			if (value < 1) continue

			const stringifiedValue = value.toString()
			// if the number has > 2 decimal places, continue with the next (smaller) unit
			if (stringifiedValue.includes('.') && stringifiedValue.split('.')[1].length > 2) {
				// if the number is larger than allowed for the unit, still use the previous (larger) unit (if it exists)
				if (value > durationUnitMaxima[unit] && i > 0) return this.toStringFor(units[i - 1])
                continue
			}

			// otherwise, format the value using the current unit
			return this.toStringFor(unit)
		}
	}

    /**
     * Formats the duration using the given unit.
     * The value is rounded to a maximum of 2 decimal places.
     */
	public toStringFor(unit: DurationUnit): string {
		const value = this.seconds / durationUnitMultipliers[unit]
        const roundedValue = Math.round(value * 100) / 100
        return `${roundedValue}${unit}`
	}

	public toSeconds(): number {
		return this.seconds
	}

	public static asSeconds(value: number, unit: DurationUnit): number {
		return value * durationUnitMultipliers[unit]
	}
}
