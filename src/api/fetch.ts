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
import { getModuleFileManager, writeConfig } from '@/utils/scriptable/fileSystem'
import { ErrorCode, createError } from '@/utils/errors'
import { KeychainManager } from '@/utils/scriptable/keychainManager'

function prepareRequest(url: string, user: FullUser) {
	const request = new Request(url)
	request.headers = {
		cookie: user.cookies.join(';'),
		Authorization: `Bearer ${user.token}`,
	}
	return request
}

/**
 * Fetches the page config for the given user and element type.
 * This is needed to get the wanted responses e.g. for the timetable.
 * @param user
 * @param elementType the element type to fetch with
 * @returns the essential page config parameters
 */
async function fetchPageConfig(user: FullUser, elementType: number) {
	// NOTE: the type has to be known beforehand to get the same request as untis, but I have no idea how
	const url = `https://${user.server}.webuntis.com/WebUntis/api/public/timetable/weekly/pageconfig?type=${elementType}`

	const request = prepareRequest(url, user)

	let json: any

	try {
		json = await request.loadJSON()

		if (!json || !json.data) {
			console.warn('⚠️ Could not fetch page config!')
			return null
		}
	} catch (error) {
		console.warn('⚠️ Could not fetch page config!')
		return null
	}

	const pageConfig: PageConfig = json.data

	const elementId = pageConfig.selectedElementId
	const formatId = pageConfig.selectedFormatId
	const selectedElementId = pageConfig.selectedElementId

	// use the element in the response, just to make sure
	let newElementType = 0
	for (const element of pageConfig.elements) {
		if (element.id === elementId) {
			newElementType = element.type
			break
		}
	}

	return {
		elementId,
		elementType: newElementType,
		formatId,
		selectedElementId,
	}
}

/**
 * The element type is a parameter which is required when requesting the timetable.
 * Different values lead to different timetables. (e.g. for the user or their class)
 * It is not obvious which value to use, so we try it out.
 * @param user the user to log in as
 * @returns the element type to use
 */
export async function determineElementType(user: FullUser) {
	const ELEMENT_TYPE_MIN = 0
	const ELEMENT_TYPE_MAX = 5

	let classPageConfig

	for (let elementType = ELEMENT_TYPE_MIN; elementType <= ELEMENT_TYPE_MAX; elementType++) {
		const pageConfig = await fetchPageConfig(user, elementType)
		if (!pageConfig) continue
		// if the element id is the user id, it is the correct one
		if (pageConfig?.elementId === user.id) {
			console.log(`Found element type for user (${elementType}).`)
			return elementType
		}
		// if the element id is not -1, it might be a class-pageconfig
		if (pageConfig.elementId && pageConfig?.elementId !== -1) {
			console.log(`Possible class-pageconfig found (${elementType}).`)
			classPageConfig = pageConfig
		}
	}

	if (classPageConfig) {
		console.warn(
			`Falling back to possible class pageconfig (${classPageConfig.elementType}), as the correct one could not be found.`
		)
		return classPageConfig.elementType
	}

	throw createError(ErrorCode.COULD_NOT_DETERMINE_ELEMENT_TYPE)
}

export async function fetchLessonsFor(user: FullUser, date: Date = new Date(), widgetConfig: Settings) {
	let elementType = parseInt(KeychainManager.get('elementType'))
	if (!elementType) {
		console.log('Could not get elementType from keychain. Trying to determine it...')
		elementType = await determineElementType(user)
		KeychainManager.set('elementType', elementType.toString())
	}

	const pageConfig = await fetchPageConfig(user, elementType)

	// NOTE: formatId does not seem to be necessary, as untis will use the default value if it is not provided
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

	// save the widget config, as transformLessons might add subjects
	// TODO: think of a better place to put this
	const { useICloud } = getModuleFileManager()
	writeConfig(useICloud, widgetConfig)

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
