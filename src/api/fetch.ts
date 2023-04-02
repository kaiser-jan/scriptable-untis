import { Settings } from '@/settings/settings'
import { Absence, ClassRole, Exam, Grade, Lesson } from '@/types/api'
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

export async function fetchLessonsFor(user: FullUser, date: Date = new Date(), widgetConfig: Settings) {
	const urlTimetable = `https://${
		user.server
	}.webuntis.com/WebUntis/api/public/timetable/weekly/data?elementType=5&elementId=${user.id}&date=${
		date.toISOString().split('T')[0]
	}&formatId=2`

	const request = prepareRequest(urlTimetable, user)

	console.log(`📅 Fetching timetable for ${user.username} (id: ${user.id})`)

	const timetableJson = await request.loadJSON()

	const timetableData = timetableJson.data.result.data
	const lessons: Lesson[] = timetableData.elementPeriods[user.id.toString()]

	console.log(`📅 Fetched timetable with ${lessons.length} lessons and ${timetableData.elements.length} elements`)

	const transformedLessons = transformLessons(lessons, timetableData.elements, widgetConfig)

	console.log(`🧬 Transformed lessons for ${Object.keys(transformedLessons).length} days`)

	return transformedLessons
}

export async function fetchSchoolYears(user: FullUser) {
	const url = 'https://arche.webuntis.com/WebUntis/api/rest/view/v1/schoolyears'

	const request = prepareRequest(url, user)
	const json = await request.loadJSON()

	if (!json) {
		console.warn('⚠️ Could not fetch school years!')
	}

	console.log(`📅 Fetched ${json.length} school years`)

	const transformedSchoolYears = transformSchoolYears(json)
	return transformedSchoolYears
}

// #region Fetch data with same structure
async function fetchData<T, TransformedT>(
	user: FullUser,
	url: string,
	key: string,
	transform: (data: T[]) => TransformedT[]
) {
	const request = prepareRequest(url, user)
	const json = await request.loadJSON()
	if (!json || !json.data || !json.data[key]) {
		console.warn(`⚠️ Could not fetch ${key}!`)
	}

	const data: T[] = json.data[key]
	console.log(`📅 Fetched ${data?.length} ${key}`)

	if (!data) return undefined

	return transform(data)
}

export async function fetchExamsFor(user: FullUser, from: Date, to: Date) {
	const urlExams = `https://${user.server}.webuntis.com/WebUntis/api/exams?studentId=${
		user.id
	}&klasseId=-1&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(to)}`

	return fetchData<Exam, TransformedExam>(user, urlExams, 'exams', transformExams)
}

export async function fetchGradesFor(user: FullUser, from: Date, to: Date) {
	const urlGrades = `https://${user.server}.webuntis.com/WebUntis/api/classreg/grade/gradeList?personId=${
		user.id
	}&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(to)}`

	return fetchData<Grade, TransformedGrade>(user, urlGrades, 'grades', transformGrades)
}

export async function fetchAbsencesFor(user: FullUser, from: Date, to: Date) {
	const urlAbsences = `https://${user.server}.webuntis.com/WebUntis/api/classreg/absences/students?studentId=${
		user.id
	}&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(
		to
	)}&excuseStatusId=-3&includeTodaysAbsence=true`

	return fetchData<Absence, TransformedAbsence>(user, urlAbsences, 'absences', transformAbsences)
}

export async function fetchClassRolesFor(user: FullUser, from: Date, to: Date) {
	const urlClassRoles = `https://${
		user.server
	}.webuntis.com/WebUntis/api/classreg/classservices?startDate=${formatDateForUntis(
		from
	)}&endDate=${formatDateForUntis(to)}`

	return fetchData<ClassRole, TransformedClassRole>(user, urlClassRoles, 'classServices', transformClassRoles)
}
//#endregion
