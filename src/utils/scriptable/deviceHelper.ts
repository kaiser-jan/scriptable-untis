/**
 * Gets the `Device.locale()` and attempts to parse it to a Intl locale.
 *
 * The parsing mostly follows the MDN web docs, but does not implement all cases.
 * It expects:
 * - a language subtag with 2-3 letters
 * - (optional) a script subtag with 4 letters
 * - a region subtag with 2 letters
 *
 * Introduced after device locale `en-US@rg=chzzzz` used in date formatting broke the widget.
 */
export function getDeviceLocaleAsIntlLocale(defaultLocale: string) {
    /** matches letters and dashes up to and including an underscore with letters */
    const LOCALE_REGEX = /^([a-z]{2,3}(?:-[a-z]{4})?[_-][a-z]{2})/i
    const match = Device.locale().match(LOCALE_REGEX)

    if (match) {
        const locale = match[0].replace('_', '-')
        console.log(`Parsed device locale "${Device.locale()}" as "${locale}".`)
        return locale
    }

    console.warn(`Could not parse device locale "${Device.locale()}", falling back to "${defaultLocale}".`)
    return defaultLocale
}
