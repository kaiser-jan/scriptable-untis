import { CURRENT_DATETIME } from '@/constants'
import { View } from '@/layout'
import { Settings } from '@/settings/settings'
import {
	TransformedAbsence,
	TransformedClassRole,
	TransformedExam,
	TransformedGrade,
	TransformedLesson,
} from '@/types/transformed'
import { getDateInXSeconds } from '@/utils/helper'
import { getRefreshDateForLessons } from '@/utils/refreshDate'
import { checkNewRefreshDate, proposeRefreshIn } from '@/widget'
import { getAbsencesFor, getExamsFor, getGradesFor, getSchoolYears, getTimetable } from './cacheOrFetch'
import { fetchClassRolesFor } from './fetch'

export interface FetchedData {
	lessonsTodayRemaining?: TransformedLesson[]
	lessonsNextDay?: TransformedLesson[]
	nextDayKey?: string
	exams?: TransformedExam[]
	grades?: TransformedGrade[]
	absences?: TransformedAbsence[]
	classRoles?: TransformedClassRole[]
	refreshDate?: Date
}

enum FetchableItems {
	TIMETABLE,
	EXAMS,
	GRADES,
	ABSENCES,
	ROLES,
}

const VIEW_FETCH_MAP = new Map<View, FetchableItems>([
	[View.LESSONS, FetchableItems.TIMETABLE],
	[View.PREVIEW, FetchableItems.TIMETABLE],
	[View.EXAMS, FetchableItems.EXAMS],
	[View.GRADES, FetchableItems.GRADES],
	[View.ABSENCES, FetchableItems.ABSENCES],
])

/**
 * Fetches the data which is required for the given views.
 */
export async function fetchDataForViews(viewNames: View[], user: FullUser, widgetConfig: Settings) {
	let fetchedData: FetchedData = {}
	const itemsToFetch = new Set<FetchableItems>()

	for (const viewName of viewNames) {
		itemsToFetch.add(VIEW_FETCH_MAP.get(viewName))
	}

	const fetchPromises: Promise<any>[] = []

	if (itemsToFetch.has(FetchableItems.TIMETABLE)) {
		const promise = getTimetable(user, widgetConfig).then(
			({ lessonsTodayRemaining, lessonsNextDay, nextDayKey }) => {
				fetchedData = { ...fetchedData, lessonsTodayRemaining, lessonsNextDay, nextDayKey }
				checkNewRefreshDate(
					getRefreshDateForLessons(lessonsTodayRemaining, lessonsNextDay, widgetConfig),
					fetchedData
				)
			}
		)
		fetchPromises.push(promise)
	}

	if (itemsToFetch.has(FetchableItems.EXAMS)) {
		const examsTo = getDateInXSeconds(widgetConfig.views.exams.scope)
		const promise = getExamsFor(user, CURRENT_DATETIME, examsTo, widgetConfig).then((exams) => {
			fetchedData.exams = exams
		})
		proposeRefreshIn(widgetConfig.cache.exams, fetchedData)
		fetchPromises.push(promise)
	}

	if (itemsToFetch.has(FetchableItems.GRADES)) {
		const gradesFrom = getDateInXSeconds(widgetConfig.views.grades.scope * -1)
		log(`Fetching grades from ${gradesFrom} to ${CURRENT_DATETIME}`)
		const promise = getGradesFor(user, gradesFrom, CURRENT_DATETIME, widgetConfig).then((grades) => {
			fetchedData.grades = grades
		})
		proposeRefreshIn(widgetConfig.cache.grades, fetchedData)
		fetchPromises.push(promise)
	}

	if (itemsToFetch.has(FetchableItems.ABSENCES)) {
		const schoolYears = await getSchoolYears(user, widgetConfig)
		// get the current school year
		const currentSchoolYear = schoolYears.find(
			(schoolYear) => schoolYear.from <= CURRENT_DATETIME && schoolYear.to >= CURRENT_DATETIME
		)
		const promise = getAbsencesFor(user, currentSchoolYear.from, CURRENT_DATETIME, widgetConfig).then(
			(absences) => {
				fetchedData.absences = absences
			}
		)
		proposeRefreshIn(widgetConfig.cache.absences, fetchedData)
		fetchPromises.push(promise)
	}

	if (itemsToFetch.has(FetchableItems.ROLES)) {
		const promise = fetchClassRolesFor(user, CURRENT_DATETIME, CURRENT_DATETIME).then((roles) => {
			fetchedData.classRoles = roles
		})
		// tomorrow midnight
		const refreshDate = new Date(new Date().setHours(24, 0, 0, 0))
		checkNewRefreshDate(refreshDate, fetchedData)
		fetchPromises.push(promise)
	}

	await Promise.all(fetchPromises)

	return fetchedData
}
