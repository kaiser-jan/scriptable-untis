import { CURRENT_DATETIME } from '@/constants'
import { readFromCache, writeToCache } from '@/api/cache'
import { fetchLessonsFor, fetchExamsFor, fetchGradesFor, fetchAbsencesFor, fetchSchoolYears } from '@/api/fetch'
import { NOTIFIABLE_TOPICS } from '@/constants'
import { compareCachedLessons, compareCachedExams, compareCachedGrades, compareCachedAbsences } from '@/features/notify'
import { Settings } from '@/settings/settings'
import { sortKeysByDate } from '@/utils/helper'
import { applyLessonConfigs } from '@/settings/lessonConfig'

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
 * @param maxAge the maximum age of the cache in seconds
 * @param widgetConfig
 * @param fetchData a function which fetches the fresh data
 * @param compareData a function which compares the fetched data with the cached data for sending notifications
 * @returns the cached or fetched data
 */
async function getCachedOrFetch<T>(
	key: string,
	maxAge: number,
	widgetConfig: Settings,
	fetchData: () => Promise<T>,
	compareData?: (fetchedData: T, cachedData: T, widgetConfig: Settings) => void
): Promise<T | undefined> {
	const { json: cachedJson, cacheAge, cacheDate } = await readFromCache(key)

	let cachedData: T | undefined = undefined 

	if (cachedJson) {
		cachedData = JSON.parse(cachedJson, jsonDateReviver)
	}

	let fetchedData: T

	log(cacheAge)
	log(maxAge * 1000)

	// refetch if the cache is too old (max age exceeded or not the same day)
	if (!cachedJson || cacheAge > maxAge * 1000 || cacheDate.getDate() !== CURRENT_DATETIME.getDate()) {
		console.log(`Fetching data ${key}, cache invalid.`)

		// we cannot fall back to the cached data if there is no internet,
		// as the script will already have failed when fetching the user
		fetchedData = await fetchData()
		if (fetchedData) {
			writeToCache(fetchedData, key)
		} else {
			console.warn(`Could not fetch data ${key}!`)
		}
	}

	const areNotificationsEnabled = widgetConfig.notifications[key]

	if (!areNotificationsEnabled) {
		if (NOTIFIABLE_TOPICS.includes(key)) {
			console.log(`Notifications for ${key} are disabled.`)
		} else {
			console.log(`Notifications for ${key} are not supported.`)
		}
	}

	if (cachedJson && fetchedData && compareData && areNotificationsEnabled) {
		console.log('There is cached data and fetched data, checking for compare...')
		if (cachedJson === JSON.stringify(fetchedData)) {
			console.log('Data did not change, not comparing.')
		} else {
			compareData(fetchedData, cachedData, widgetConfig)
		}
	}

	return fetchedData ?? cachedData
}

export async function getLessonsFor(user: FullUser, date: Date, isNext: boolean, widgetConfig: Settings) {
	const key = isNext ? 'lessons_next' : 'lessons'
	return getCachedOrFetch(
		key,
		widgetConfig.cache.lessons,
		widgetConfig,
		() => fetchLessonsFor(user, date, widgetConfig),
		compareCachedLessons
	)
}

export async function getExamsFor(user: FullUser, from: Date, to: Date, widgetConfig: Settings) {
	return getCachedOrFetch(
		'exams',
		widgetConfig.cache.exams,
		widgetConfig,
		() => fetchExamsFor(user, from, to),
		compareCachedExams
	)
}

export async function getGradesFor(user: FullUser, from: Date, to: Date, widgetConfig: Settings) {
	return getCachedOrFetch(
		'grades',
		widgetConfig.cache.grades,
		widgetConfig,
		() => fetchGradesFor(user, from, to),
		compareCachedGrades
	)
}

export async function getAbsencesFor(user: FullUser, from: Date, to: Date, widgetConfig: Settings) {
	return getCachedOrFetch(
		'absences',
		widgetConfig.cache.absences,
		widgetConfig,
		() => fetchAbsencesFor(user, from, to),
		compareCachedAbsences
	)
}

export async function getSchoolYears(user: FullUser, widgetConfig: Settings) {
	return getCachedOrFetch('school_years', widgetConfig.cache.schoolYears, widgetConfig, () =>
		fetchSchoolYears(user)
	)
}

/**
 * Fetches the timetable for the current week (and for the next week if necessary) and filters which lessons remain for today.
 * @param user the user to fetch for
 * @param widgetConfig
 * @returns the remaining lessons for today, the lessons tomorrow and the key (date) of the next day
 */
export async function getTimetable(user: FullUser, widgetConfig: Settings) {
	// fetch this weeks lessons
	let timetable = await getLessonsFor(user, CURRENT_DATETIME, false, widgetConfig)

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
		console.log(`No lessons for tomorrow -> fetching next week. (${nextWeekFirstDate.toISOString()})`)
		// fetch the next week
		const nextWeekTimetable = await getLessonsFor(user, nextWeekFirstDate, true, widgetConfig)
		// merge the next week timetable into the current one
		Object.assign(timetable, nextWeekTimetable)
		// set the next day key to the first day of the next week
		nextDayKey = sortKeysByDate(nextWeekTimetable)[0]
	}

	// apply custom lesson configs
	// TODO: it seems more reasonable to NOT do this while transforming,
	// as these are different tasks and config changes would not behave as expected
	applyLessonConfigs(timetable, widgetConfig)

	console.log(`Next day: ${nextDayKey}`)
	// the timetable for the next day in the timetable (ignore weekends)
	const lessonsNextDay = timetable[nextDayKey]

	const lessonsToday = timetable[todayKey] ?? []
	// the lessons which have not passed yet
	const lessonsTodayRemaining = lessonsToday.filter((l) => l.to > CURRENT_DATETIME)

	// check the teacher selection from the config
	lessonsTodayRemaining.filter((lesson) => {
		if (!lesson.subject) return true
		const lessonOption = widgetConfig.subjects[lesson.subject.name]
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
