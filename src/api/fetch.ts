import { Config } from "@/preferences/config"
import { formatDateForUntis } from "@/utils/helper"
import { transformExams, transformGrades, transformAbsences, transformClassRoles, transformSchoolYears, transformLessons } from "./transform"
import { Lesson, Exam, Grade, ClassRole, Absence } from "@/types/api"

function prepareRequest(url: string, user: FullUser) {
	const request = new Request(url)
	request.headers = {
		cookie: user.cookies.join(';'),
		Authorization: `Bearer ${user.token}`,
	}
	return request
}

export async function fetchLessonsFor(user: FullUser, date: Date = new Date(), config: Config) {
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

	const transformedLessons = transformLessons(lessons, timetableData.elements, config)

	console.log(`🧬 Transformed ${Object.keys(transformedLessons).length} lessons`)

	return transformedLessons
}

export async function fetchExamsFor(user: FullUser, from: Date, to: Date) {
	const urlExams = `https://${user.server}.webuntis.com/WebUntis/api/exams?studentId=${
		user.id
	}&klasseId=-1&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(to)}`

	const request = prepareRequest(urlExams, user)
	const json = await request.loadJSON()

	if (!json || !json.data || !json.data.exams) {
		console.warn('⚠️ Could not fetch exams!')
	}

	const exams: Exam[] = json.data.exams
	console.log(`📅 Fetched ${exams.length} exams`)

	const transformedExams = transformExams(exams)
	return transformedExams
}

export async function fetchGradesFor(user: FullUser, from: Date, to: Date) {
	const urlGrades = `https://${user.server}.webuntis.com/WebUntis/api/classreg/grade/gradeList?personId=${
		user.id
	}&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(to)}`

	const request = prepareRequest(urlGrades, user)
	const json = await request.loadJSON()

	if (!json || !json.data) {
		console.warn('⚠️ Could not fetch grades!')
	}

	const grades: Grade[] = json.data
	console.log(`📅 Fetched ${grades.length} grades`)

	const transformedGrades = transformGrades(grades)
	return transformedGrades
}

export async function fetchAbsencesFor(user: FullUser, from: Date, to: Date) {
	const urlAbsences = `https://${user.server}.webuntis.com/WebUntis/api/classreg/absences/students?studentId=${
		user.id
	}&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(
		to
	)}&excuseStatusId=-3&includeTodaysAbsence=true`

	const request = prepareRequest(urlAbsences, user)
	const json = await request.loadJSON()

	if (!json || !json.data || !json.data.absences) {
		console.warn('⚠️ Could not fetch absences!')
	}

	const absences: Absence[] = json.data.absences
	console.log(`📅 Fetched ${absences.length} absences`)

	const transformedAbsences = transformAbsences(absences)
	return transformedAbsences
}

export async function fetchClassRolesFor(user: FullUser, from: Date, to: Date) {
	const urlClassRoles = `https://${
		user.server
	}.webuntis.com/WebUntis/api/classreg/classservices?startDate=${formatDateForUntis(
		from
	)}&endDate=${formatDateForUntis(to)}`

	const request = prepareRequest(urlClassRoles, user)
	const json = await request.loadJSON()

	if (!json || !json.data || !json.data.classRoles) {
		console.warn('⚠️ Could not fetch class roles!')
	}

	const classRoles: ClassRole[] = json.data.classRoles
	console.log(`📅 Fetched ${classRoles.length} class roles`)

	const transformedClassRoles = transformClassRoles(classRoles)
	return transformedClassRoles
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
