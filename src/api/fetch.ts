import { Settings } from '@/settings/settings'
import { Absence, ClassRole, Exam, Grade, Lesson, PageConfig } from '@/types/api'
import { TransformedAbsence, TransformedClassRole, TransformedExam, TransformedGrade } from '@/types/transformed'
import { formatDateForUntis } from '@/utils/helper'
import {
	transformAbsences,
	transformClassRoles,
	transformExams,
	transformGrades,
	transformSchoolYears,
} from './transform'
import { transformLessons } from './transformLessons'

function prepareRequest(url: string, user: FullUser) {
	const request = new Request(url)
	request.headers = {
		cookie: user.cookies.join(';'),
		Authorization: `Bearer ${user.token}`,
	}
	return request
}

// TODO: refactor and document
async function fetchPageConfig(user) {
	const url = `https://${user.server}.webuntis.com/WebUntis/api/public/timetable/weekly/pageconfig?type=1`

	const request = prepareRequest(url, user)
	const json = await request.loadJSON()

	if (!json || !json.data) {
		console.warn('⚠️ Could not fetch page config!')
		return undefined
	}

	const pageConfig: PageConfig = json.data

	const elementId = pageConfig.selectedElementId
	const formatId = pageConfig.selectedFormatId
	let elementType = 0
	const selectedElementId = pageConfig.selectedElementId

	for (const element of pageConfig.elements) {
		if (element.id === elementId) {
			elementType = element.type
			break
		}
	}

	if (!elementType) {
		console.warn('⚠️ Could not determine element type!')
	}

	return {
		elementId,
		elementType,
		formatId,
		selectedElementId,
	}
}

export async function fetchLessonsFor(user: FullUser, date: Date = new Date(), widgetConfig: Settings) {
	const pageConfig = await fetchPageConfig(user)

	const urlTimetable = `https://${user.server}.webuntis.com/WebUntis/api/public/timetable/weekly/data?elementType=${
		pageConfig.elementType
	}&elementId=${pageConfig.elementId}&date=${date.toISOString().split('T')[0]}&formatId=${pageConfig.formatId}`

	const request = prepareRequest(urlTimetable, user)

	console.log(`📅 Fetching timetable for ${user.username} (id: ${user.id})`)

	const timetableJson = await request.loadJSON()

	const timetableData = timetableJson.data.result.data
	const lessons: Lesson[] = timetableData.elementPeriods[pageConfig.selectedElementId.toString()]

	console.log(`📅 Fetched timetable with ${lessons.length} lessons and ${timetableData.elements.length} elements`)

	const transformedLessons = transformLessons(lessons, timetableData.elements, widgetConfig)

	console.log(`🧬 Transformed lessons for ${Object.keys(transformedLessons).length} days`)

	return transformedLessons
}

export async function fetchSchoolYears(user: FullUser) {
	const url = `https://${user.server}.webuntis.com/WebUntis/api/rest/view/v1/schoolyears`

	const request = prepareRequest(url, user)
	const json = await request.loadJSON()

	if (!json) {
		console.warn('⚠️ Could not fetch school years!')
		return undefined
	}

	console.log(`📅 Fetched ${json.length} school years`)

	const transformedSchoolYears = transformSchoolYears(json)
	return transformedSchoolYears
}

// #region Fetch data with same structure
async function fetchArrayData<T, TransformedT>(
	user: FullUser,
	url: string,
	key: string,
	transform: (data: T[]) => TransformedT[],
	expectArray = false
) {
	const request = prepareRequest(url, user)
	const json = await request.loadJSON()

	if (!json || !json.data || (!expectArray && !json.data[key])) {
		console.warn(`⚠️ Could not fetch ${key}!`)
	}

	const data: T[] = expectArray ? json.data : json.data[key]
	console.log(`📅 Fetched ${data?.length} ${key}`)

	if (!data) return []

	return transform(data)
}

export async function fetchExamsFor(user: FullUser, from: Date, to: Date) {
	const urlExams = `https://${user.server}.webuntis.com/WebUntis/api/exams?studentId=${
		user.id
	}&klasseId=-1&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(to)}`

	return fetchArrayData<Exam, TransformedExam>(user, urlExams, 'exams', transformExams)
}

export async function fetchGradesFor(user: FullUser, from: Date, to: Date) {
	const urlGrades = `https://${user.server}.webuntis.com/WebUntis/api/classreg/grade/gradeList?personId=${
		user.id
	}&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(to)}`

	// out of some reason, the grades are not in the "grades" key, but directly in the data object
	return fetchArrayData<Grade, TransformedGrade>(user, urlGrades, 'grades', transformGrades, true)
}

export async function fetchAbsencesFor(user: FullUser, from: Date, to: Date) {
	const urlAbsences = `https://${user.server}.webuntis.com/WebUntis/api/classreg/absences/students?studentId=${
		user.id
	}&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(
		to
	)}&excuseStatusId=-3&includeTodaysAbsence=true`

	return fetchArrayData<Absence, TransformedAbsence>(user, urlAbsences, 'absences', transformAbsences)
}

export async function fetchClassRolesFor(user: FullUser, from: Date, to: Date) {
	const urlClassRoles = `https://${
		user.server
	}.webuntis.com/WebUntis/api/classreg/classservices?startDate=${formatDateForUntis(
		from
	)}&endDate=${formatDateForUntis(to)}`

	return fetchArrayData<ClassRole, TransformedClassRole>(user, urlClassRoles, 'classServices', transformClassRoles)
}
//#endregion
