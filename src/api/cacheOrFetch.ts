import { CURRENT_DATETIME } from "@/constants"
import { readFromCache, writeToCache } from "@/api/cache"
import { fetchLessonsFor, fetchExamsFor, fetchGradesFor, fetchAbsencesFor, fetchSchoolYears } from "@/api/fetch"
import { NOTIFIABLE_TOPICS } from "@/constants"
import { compareCachedLessons, compareCachedExams, compareCachedGrades, compareCachedAbsences } from "@/features/notify"
import { Options, applyLessonConfigs } from "@/preferences/config"
import { sortKeysByDate } from "@/utils/helper"

/**
 * Transforms a json date string back to a Date object.
 */
function jsonDateReviver(key: string, value: any) {
	if (typeof value === 'string' && /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.test(value)) {
		return new Date(value)
	}
	return value
}

/**
 * Tries to read the given cache, or fetches the data if the cache is too old.
 * @param key the key of the cache
 * @param maxAge the maximum age of the cache in milliseconds
 * @param options
 * @param fetchData a function which fetches the fresh data
 * @param compareData a function which compares the fetched data with the cached data for sending notifications
 * @returns the cached or fetched data
 */
async function getCachedOrFetch<T>(
	key: string,
	maxAge: number,
	options: Options,
	fetchData: () => Promise<T>,
	compareData?: (fetchedData: T, cachedData: T, options: Options) => void
): Promise<T> {
	const { json: cachedJson, cacheAge, cacheDate } = await readFromCache(key)

	let cachedData = {} as T

	if (cachedJson) {
		cachedData = JSON.parse(cachedJson, jsonDateReviver)
	}

	let fetchedData: T

	// refetch if the cache is too old (max age exceeded or not the same day)
	if (!cachedJson || cacheAge > maxAge || cacheDate.getDate() !== CURRENT_DATETIME.getDate()) {
		console.log(`Fetching data ${key}, cache invalid.`)

		// we cannot fall back to the cached data if there is no internet,
		// as the script will already have failed when fetching the user
		fetchedData = await fetchData()
		writeToCache(fetchedData, key)
	}

	const areNotificationsEnabled = options.notifications.enabled[key]

	if (!areNotificationsEnabled && NOTIFIABLE_TOPICS.includes(key)) {
		console.log(`Notifications for ${key} are disabled.`)
	}

	if (cachedJson && fetchedData && compareData && areNotificationsEnabled) {
		console.log('There is cached data and fetched data, checking for compare...')
		if (cachedJson === JSON.stringify(fetchedData)) {
			console.log('Data did not change, not comparing.')
		} else {
			compareData(fetchedData, cachedData, options)
		}
	}

	return fetchedData ?? cachedData
}

export async function getLessonsFor(user: FullUser, date: Date, isNext: boolean, options: Options) {
	const key = isNext ? 'lessons_next' : 'lessons'
	return getCachedOrFetch(
		key,
		options.config.cacheHours.lessons * 60 * 60 * 1000,
		options,
		() => fetchLessonsFor(user, date, options),
		compareCachedLessons
	)
}

export async function getExamsFor(user: FullUser, from: Date, to: Date, options: Options) {
	return getCachedOrFetch(
		'exams',
		options.config.cacheHours.exams * 60 * 60 * 1000,
		options,
		() => fetchExamsFor(user, from, to),
		compareCachedExams
	)
}

export async function getGradesFor(user: FullUser, from: Date, to: Date, options: Options) {
	return getCachedOrFetch(
		'grades',
		options.config.cacheHours.grades * 60 * 60 * 1000,
		options,
		() => fetchGradesFor(user, from, to),
		compareCachedGrades
	)
}

export async function getAbsencesFor(user: FullUser, from: Date, to: Date, options: Options) {
	return getCachedOrFetch(
		'absences',
		options.config.cacheHours.absences * 60 * 60 * 1000,
		options,
		() => fetchAbsencesFor(user, from, to),
		compareCachedAbsences
	)
}

export async function getSchoolYears(user: FullUser, options: Options) {
	return getCachedOrFetch('school_years', options.config.cacheHours.schoolYears * 60 * 60 * 1000, options, () =>
		fetchSchoolYears(user)
	)
}

/**
 * Fetches the timetable for the current week (and for the next week if necessary) and filters which lessons remain for today.
 * @param user the user to fetch for
 * @param options
 * @returns the remaining lessons for today, the lessons tomorrow and the key (date) of the next day
 */
export async function getTimetable(user: FullUser, options: Options) {
	// fetch this weeks lessons
	let timetable = await getLessonsFor(user, CURRENT_DATETIME, false, options)

	// get the current day as YYYY-MM-DD
	const todayKey = CURRENT_DATETIME.toISOString().split('T')[0]

	// sort the keys of the timetable (by date)
	const sortedKeys = sortKeysByDate(timetable)
	// find the index of the current day
	const todayIndex = sortedKeys.indexOf(todayKey)
	// get the next day
	let nextDayKey = sortedKeys[todayIndex + 1]

	// fetch the next week, if the next day is on the next week
	if (todayIndex === -1 || todayIndex === sortedKeys.length - 1) {
		// get the first date of the current timetable week
		const firstDate = sortedKeys[0] ? new Date(sortedKeys[0]) : CURRENT_DATETIME
		// get the first date of the next timetable week
		const nextWeekFirstDate = new Date(firstDate.getTime() + 7 * 24 * 60 * 60 * 1000)
		console.log(`No lessons for today/tomorrow -> fetching next week. (${nextWeekFirstDate.toISOString()})`)
		// fetch the next week
		const nextWeekTimetable = await getLessonsFor(user, nextWeekFirstDate, true, options)
		// merge the next week timetable into the current one
		Object.assign(timetable, nextWeekTimetable)
		// set the next day key to the first day of the next week
		nextDayKey = sortKeysByDate(nextWeekTimetable)[0]
	}

	// apply custom lesson configs
	// NOTE: it seems more reasonable to NOT do this while transforming,
	// as these are different tasks and config changes would not behave as expected
	applyLessonConfigs(timetable, options)

	console.log(`Next day: ${nextDayKey}`)
	// the timetable for the next day in the timetable (ignore weekends)
	const lessonsNextDay = timetable[nextDayKey]

	const lessonsToday = timetable[todayKey] ?? []
	// the lessons which have not passed yet
	const lessonsTodayRemaining = lessonsToday.filter((l) => l.to > CURRENT_DATETIME)

	// check the teacher selection from the config
	lessonsTodayRemaining.filter((lesson) => {
		if (!lesson.subject) return true
		const lessonOption = options.lessonOptions[lesson.subject.name]
		if (!lessonOption) return true
		if (Array.isArray(lessonOption)) {
			// check if the teacher is in the lesson
			return lessonOption.some((option) => {
				return lesson.teachers.some((teacher) => teacher.name === option.teacher)
			})
		}
		return true
	})

	return { lessonsTodayRemaining, lessonsNextDay, nextDayKey }
}
