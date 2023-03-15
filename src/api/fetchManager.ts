import { CURRENT_DATETIME } from "@/constants"
import { View } from "@/layout"
import { Options } from "@/preferences/config"
import { getDateInXDays } from "@/utils/helper"
import { getRefreshDateForLessons } from "@/utils/refreshDate"
import { getTimetable, getExamsFor, getGradesFor, getSchoolYears, getAbsencesFor } from "./cacheOrFetch"
import { fetchClassRolesFor } from "./fetch"
import { checkNewRefreshDate, proposeRefreshInXHours } from "@/widget"
import { TransformedLesson, TransformedExam, TransformedGrade, TransformedAbsence, TransformedClassRole } from "@/types/transformed"

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
export async function fetchDataForViews(viewNames: View[], user: FullUser, options: Options) {
	let fetchedData: FetchedData = {}
	const itemsToFetch = new Set<FetchableItems>()

	for (const viewName of viewNames) {
		itemsToFetch.add(VIEW_FETCH_MAP.get(viewName))
	}

	const fetchPromises: Promise<any>[] = []

	if (itemsToFetch.has(FetchableItems.TIMETABLE)) {
		const promise = getTimetable(user, options).then(({ lessonsTodayRemaining, lessonsNextDay, nextDayKey }) => {
			fetchedData = { ...fetchedData, lessonsTodayRemaining, lessonsNextDay, nextDayKey }
			checkNewRefreshDate(getRefreshDateForLessons(lessonsTodayRemaining, lessonsNextDay, options), fetchedData)
		})
		fetchPromises.push(promise)
	}

	if (itemsToFetch.has(FetchableItems.EXAMS)) {
		const examsFrom = getDateInXDays(options.views.exams.scopeDays)
		const promise = getExamsFor(user, examsFrom, CURRENT_DATETIME, options).then((exams) => {
			fetchedData.exams = exams
		})
		proposeRefreshInXHours(options.config.cacheHours.exams, fetchedData)
		fetchPromises.push(promise)
	}

	if (itemsToFetch.has(FetchableItems.GRADES)) {
		const gradesFrom = getDateInXDays(options.views.grades.scopeDays)
		const promise = getGradesFor(user, gradesFrom, CURRENT_DATETIME, options).then((grades) => {
			fetchedData.grades = grades
		})
		proposeRefreshInXHours(options.config.cacheHours.grades, fetchedData)
		fetchPromises.push(promise)
	}

	if (itemsToFetch.has(FetchableItems.ABSENCES)) {
		const schoolYears = await getSchoolYears(user, options)
		// get the current school year
		const currentSchoolYear = schoolYears.find(
			(schoolYear) => schoolYear.from <= CURRENT_DATETIME && schoolYear.to >= CURRENT_DATETIME
		)
		const promise = getAbsencesFor(user, currentSchoolYear.from, CURRENT_DATETIME, options).then((absences) => {
			fetchedData.absences = absences
		})
		proposeRefreshInXHours(options.config.cacheHours.absences, fetchedData)
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
