// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: graduation-cap;

/*
Untis Widget by JFK-05

A widget used to display information from Untis.
This includes upcoming lessons, exams and grades.
*/

const CURRENT_DATETIME = new Date() // '2022-09-15T14:00' or '2022-09-19T12:30'

//#region Constants

const LOCALE = Device.locale().replace('_', '-')
const FOOTER_HEIGHT = 20

let usingOldCache = false

//#endregion

//#region Types

//#region Transformed

interface TransformedStatelessElement {
	id: number
	name: string
}

interface ExtendedTransformedElement extends TransformedStatelessElement {
	longName: string
}

interface Teacher extends TransformedStatelessElement {}
interface Group extends ExtendedTransformedElement {}
interface Subject extends ExtendedTransformedElement {}
interface Room extends ExtendedTransformedElement {
	capacity: number
}

type StatelessElement = Teacher | Group | Subject | Room

type StatefulElement = Stateful<StatelessElement>

// a type for stateless elements with state and original
type Stateful<T extends StatelessElement> = T & {
	state: ElementState
	original?: T
}

interface TransformedLesson {
	id: number
	note?: string // lessonText
	text?: string // periodText
	info?: string // periodInfo
	substitutionText?: string

	from: Date // date + startTime
	to: Date // date + endTime

	group: Group
	subject?: Subject
	teachers: Teacher[]
	rooms: Room[]

	state: LessonState // cellState
	isEvent: boolean // is.event

	exam?: {
		name: string
		markSchemaId: number
	}

	isRescheduled: boolean
	rescheduleInfo?: {
		isSource: boolean
		otherFrom: Date
		otherTo: Date
	}

	duration: number
	backgroundColor?: string
}

interface TransformedLessonWeek {
	[key: string]: TransformedLesson[]
}

interface TransformedExam {
	type: string
	name: string
	from: Date
	to: Date
	subject: string
	teacherNames: string[]
	roomNames: string[]
	// text: string
}

interface TransformedGrade {
	subject: string
	date: Date
	lastUpdated: Date
	text: string
	schemaId: number

	mark: {
		displayValue: number
		name: string
		id: number
	}

	examType: {
		name: string
		longName: string
	}

	exam?: {
		name: string
		id: number
		date: Date
	}
}

interface TransformedAbsence {
	from: Date
	to: Date
	createdBy: string
	reasonId: number
	isExcused: boolean
	excusedBy?: string
}

interface TransformedClassRole {
	fromDate: Date
	toDate: Date
	firstName: string
	lastName: string
	dutyName: string
}

interface TransformedSchoolYear {
	id: number
	name: string
	from: Date
	to: Date
}

//#endregion

//#region Untis

enum ElementType {
	GROUP = 1,
	TEACHER = 2,
	SUBJECT = 3,
	ROOM = 4,
}

type Element = ElementGroup | ElementTeacher | ElementSubject | ElementRoom

interface UnresolvedElement {
	type: ElementType
	id: number
	orgId: number
	missing: boolean
	state: ElementState
}
interface ElementBase {
	type: number
	id: number
	name: string
	canViewTimetable: boolean
	roomCapacity: number
}

interface ElementExtended extends ElementBase {
	longName: string
	displayName: string
	alternatename: string
}

interface ElementGroup extends ElementExtended {
	type: 1
}

interface ElementTeacher extends ElementBase {
	type: 2
	externKey: string
}

interface ElementSubject extends ElementExtended {
	type: 3
}

interface ElementRoom extends ElementExtended {
	type: 4
}

enum LessonState {
	NORMAL = 'STANDARD',
	FREE = 'FREE',
	CANCELED = 'CANCEL',
	EXAM = 'EXAM',
	RESCHEDULED = 'SHIFT',
	SUBSTITUTED = 'SUBSTITUTION',
	ROOM_SUBSTITUTION = 'ROOMSUBSTITUTION',
	ADDITIONAL = 'ADDITIONAL',
}

enum ElementState {
	REGULAR = 'REGULAR',
	SUBSTITUTED = 'SUBSTITUTED',
	ABSENT = 'ABSENT',
}

interface Lesson {
	id: number
	lessonId: number
	lessonNumber: number
	lessonCode: 'UNTIS_ADDITIONAL' | 'LESSON'
	lessonText: string

	hasPeriodText: boolean
	periodText: string
	periodInfo: string
	periodAttachments: any[]
	substText: string

	date: number
	startTime: number
	endTime: number

	elements: UnresolvedElement[]

	hasInfo: boolean
	code: number // known: 0, 12, 120, 124
	cellState: LessonState
	priority: number // known: 1, 3, 5, 8
	is: {
		standard?: boolean
		free?: boolean
		additional?: boolean
		cancelled?: boolean
		shift?: boolean
		substitution?: boolean
		exam?: boolean
		event: boolean
	}

	roomCapacity: number
	studentGroup: string
	studentCount: number

	exam?: {
		markSchemaId: number // 1 = grade, 2 = ?, 3 = +/- etc.
		date: number
		name: string
		id: number
	}

	rescheduleInfo?: {
		date: number
		startTime: number
		endTime: number
		isSource: boolean
	}

	videoCall?: {
		videoCallUrl: string
		active: boolean
	}
}

interface Exam {
	examType: string
	name: string
	examDate: number
	startTime: number
	endTime: number
	subject: string
	teachers: string[]
	rooms: string[]
	text: string

	id: number
	studentClass: string[]
	assignedStudents: {
		klasse: {
			id: number
			name: string
		}
		displayName: string
		id: number
	}[]
	grade: string
}

interface Grade {
	grade: {
		mark: {
			markValue: number
			markSchemaId: number
			markDisplayValue: number
			name: string
			id: number
		}
		schoolyearId: number
		examTypeId: number
		lastUpdate: number
		exam: {
			markSchemaId: number
			date: number
			name: string
			id: number
		}
		examType: {
			markSchemaId: number
			weightFactor: number
			longname: string
			name: string
			id: number
		}
		markSchemaId: number
		examId: number
		text: string
		date: number
		id: number
	}
	subject: string
	personId: number
}

interface Absence {
	startDate: number
	endDate: number
	startTime: number
	endTime: number
	createdUser: string // the "identifier" of the creator (teacher shortname, student "id")
	reasonId: number // maybe school specific?
	isExcused: boolean

	id: number
	createDate: number
	lastUpdate: number
	updatedUser: string
	reason: string // custom reason?
	text: string
	interruptions: any[]
	canEdit: boolean
	studentName: string
	excuseStatus: string | null

	excuse: {
		// mostly empty, unknown use
		id: number
		text: string
		excuseDate: number
		excuseStatus: string
		isExcused: boolean
		userId: number
		username: string
	}
}

interface ClassRole {
	id: number
	personId: number
	klasse: {
		id: number
		name: string
	}
	foreName: string // first name
	longName: string // last name
	duty: {
		id: number // school specific?
		label: string // duty name
	}
	startDate: number
	endDate: number
	text: string // empty?
}

interface SchoolYear {
	id: number
	name: string
	dateRange: {
		start: string
		end: string
	}
}

//#endregion

//#region User

interface UserData {
	server: string
	school: string
	username: string
}

interface User extends UserData {
	cookies: string[]
	token: string
}

interface FullUser extends User {
	id: number
	displayName: string
	imageUrl: string
}

//#endregion

//#endregion

//#region API

//#region API

function formatDateForUntis(date: Date) {
	const paddedMonth = (date.getMonth() + 1).toString().padStart(2, '0')
	const paddedDay = date.getDate().toString().padStart(2, '0')
	return `${date.getFullYear()}${paddedMonth}${paddedDay}`
}

function prepareRequest(url: string, user: FullUser) {
	const request = new Request(url)
	request.headers = {
		cookie: user.cookies.join(';'),
		Authorization: `Bearer ${user.token}`,
	}
	return request
}

async function fetchLessonsFor(user: FullUser, date: Date = new Date(), config: Config) {
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

	console.log(`📅 Got timetable with ${lessons.length} lessons and ${timetableData.elements.length} elements`)

	const transformedLessons = transformLessons(lessons, timetableData.elements, config)

	console.log(`🤖 Transformed ${Object.keys(transformedLessons).length} lessons`)

	return transformedLessons
}

async function fetchExamsFor(user: FullUser, from: Date, to: Date) {
	const urlExams = `https://${user.server}.webuntis.com/WebUntis/api/exams?studentId=${
		user.id
	}&klasseId=-1&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(to)}`

	const request = prepareRequest(urlExams, user)
	const json = await request.loadJSON()

	if (!json || !json.data || !json.data.exams) {
		console.warn('⚠️ Could not fetch exams!')
	}

	const exams: Exam[] = json.data.exams
	console.log(`📅 Got ${exams.length} exams`)

	const transformedExams = transformExams(exams)
	return transformedExams
}

async function fetchGradesFor(user: FullUser, from: Date, to: Date) {
	const urlGrades = `https://${user.server}.webuntis.com/WebUntis/api/classreg/grade/gradeList?personId=${
		user.id
	}&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(to)}`

	const request = prepareRequest(urlGrades, user)
	const json = await request.loadJSON()

	if (!json || !json.data) {
		console.warn('⚠️ Could not fetch grades!')
	}

	const grades: Grade[] = json.data
	console.log(`📅 Got ${grades.length} grades`)

	const transformedGrades = transformGrades(grades)
	return transformedGrades
}

async function fetchAbsencesFor(user: FullUser, from: Date, to: Date) {
	const urlAbsences = `https://${user.server}.webuntis.com/WebUntis/api/classreg/absences/students?studentId=${
		user.id
	}&startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(to)}&excuseStatusId=-3&includeTodaysAbsence=true`

	const request = prepareRequest(urlAbsences, user)
	const json = await request.loadJSON()

	if (!json || !json.data || !json.data.absences) {
		console.warn('⚠️ Could not fetch absences!')
	}

	const absences: Absence[] = json.data.absences
	console.log(`📅 Got ${absences.length} absences`)

	const transformedAbsences = transformAbsences(absences)
	return transformedAbsences
}

async function fetchClassRolesFor(user: FullUser, from: Date, to: Date) {
	const urlClassRoles = `https://${
		user.server
	}.webuntis.com/WebUntis/api/classreg/classservices?startDate=${formatDateForUntis(from)}&endDate=${formatDateForUntis(to)}`

	const request = prepareRequest(urlClassRoles, user)
	const json = await request.loadJSON()

	if (!json || !json.data || !json.data.classRoles) {
		console.warn('⚠️ Could not fetch class roles!')
	}

	const classRoles: ClassRole[] = json.data.classRoles
	console.log(`📅 Got ${classRoles.length} class roles`)

	const transformedClassRoles = transformClassRoles(classRoles)
	return transformedClassRoles
}

async function fetchSchoolYears(user: FullUser) {
	const url = 'https://arche.webuntis.com/WebUntis/api/rest/view/v1/schoolyears'

	const request = prepareRequest(url, user)
	const json = await request.loadJSON()

	if (!json) {
		console.warn('⚠️ Could not fetch school years!')
	}

	console.log(`📅 Got ${json.length} school years`)

	const transformedSchoolYears = transformSchoolYears(json)
	return transformedSchoolYears
}

//#endregion

//#region Caching

interface CachedUser extends FullUser {
	lastUpdated: Date
}

async function prepareUser(options: Options, ignoreCache = false): Promise<FullUser> {
	const fileManager = options.useICloud ? FileManager.iCloud() : FileManager.local()
	const userCacheFileName = 'user.json'
	const userCachePath = fileManager.joinPath(options.appDirectory, userCacheFileName)
	const userCacheExists = fileManager.fileExists(userCachePath)

	if (!ignoreCache && userCacheExists) {
		if (options.useICloud) {
			await fileManager.downloadFileFromiCloud(userCachePath)
		}

		const cachedUser: CachedUser = JSON.parse(fileManager.readString(userCachePath))
		// parse the date
		cachedUser.lastUpdated = new Date(cachedUser.lastUpdated)

		// get the cache age
		const userCacheAge = new Date().getTime() - cachedUser.lastUpdated.getTime()
		console.log(`User cache age: ${(userCacheAge / 1000 / 60).toFixed(2)} minutes`)

		if (userCacheAge < options.config.cache.user * 60 * 60 * 1000) {
			console.log('Using cached user.')
			return cachedUser
		}
	} else {
		console.log('Ignoring cache.')
	}

	// get the user data from the keychain
	const userData = await readKeychain(true)
	// log into untis
	const fetchedUser = await login(userData, userData.password)

	// write the user to the cache
	const userToCache: CachedUser = {
		...fetchedUser,
		lastUpdated: new Date(),
	}
	fileManager.writeString(userCachePath, JSON.stringify(userToCache))

	console.log('Fetched user from untis and wrote to cache.')

	return fetchedUser
}

// TODO: consider adding a validity date (e.g. when the target date for lessons changes)
async function readFromCache(cacheName: string) {
	const fileManager = FileManager.local()
	const cacheDirectory = fileManager.cacheDirectory()
	const untisCacheDirectory = fileManager.joinPath(cacheDirectory, 'untis')

	if (!fileManager.fileExists(untisCacheDirectory)) {
		console.log('Cache directory does not exist.')
		return {}
	}

	const cachePath = fileManager.joinPath(untisCacheDirectory, `${cacheName}.json`)
	const cacheExists = fileManager.fileExists(cachePath)

	if (!cacheExists) {
		console.log(`Cache for ${cacheName} does not exist.`)
		return {}
	}

	const cacheDate = new Date(fileManager.modificationDate(cachePath))
	const cacheAge = new Date().getTime() - cacheDate.getTime()

	console.log(`Checking cache ${cacheName} (${Math.round(cacheAge / 60_000)}min).`)

	const data = JSON.parse(fileManager.readString(cachePath), (name, value) => {
		if (typeof value === 'string' && /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.test(value)) {
			return new Date(value)
		}
		return value
	})

	return { data, cacheAge, cacheDate }
}

function writeToCache(data: Object, cacheName: string) {
	const fileManager = FileManager.local()
	const cacheDirectory = fileManager.cacheDirectory()
	const untisCacheDirectory = fileManager.joinPath(cacheDirectory, 'untis')
	if (!fileManager.fileExists(untisCacheDirectory)) {
		fileManager.createDirectory(untisCacheDirectory, true)
	}
	const cachePath = fileManager.joinPath(untisCacheDirectory, `${cacheName}.json`)
	fileManager.writeString(cachePath, JSON.stringify(data))
}

//#endregion

//#region Fetching + Caching

async function getCachedOrFetch<T>(
	key: string,
	maxAge: number,
	fetchData: () => Promise<T>,
	compareData?: (fetchedData: T, cachedData: T) => void
): Promise<T> {
	const { data: cachedData, cacheAge, cacheDate } = await readFromCache(key)

	let fetchedData: T

	// refetch if the cache is too old (max age exceeded or not the same day)
	if (!cachedData || cacheAge > maxAge || cacheDate.getDate() !== CURRENT_DATETIME.getDate()) {
		log(`Fetching data ${key}, cache invalid.`)
		try {
			fetchedData = await fetchData()
			writeToCache(fetchedData, key)
		} catch (error) {
			const castedError = error as Error
			if (castedError.message.toLowerCase() === ScriptableErrors.NO_INTERNET.toLowerCase()) {
				log('No internet connection, falling back to old cached data.')
				usingOldCache = true
				return cachedData
			}
			throw error
		}
	}

	if (cachedData && fetchedData && compareData) {
		compareData(fetchedData, cachedData)
	}

	return fetchedData ?? cachedData
}

async function getLessonsFor(user: FullUser, date: Date, isNext: boolean, options: Options) {
	const key = isNext ? 'lessons_next' : 'lessons'
	return getCachedOrFetch(
		key,
		options.config.cache.lessons * 60 * 60 * 1000,
		() => fetchLessonsFor(user, date, options),
		compareCachedLessons
	)
}

async function getExamsFor(user: FullUser, from: Date, to: Date, options: Options) {
	return getCachedOrFetch('exams', options.config.cache.exams * 60 * 60 * 1000, () => fetchExamsFor(user, from, to))
}

async function getGradesFor(user: FullUser, from: Date, to: Date, options: Options) {
	return getCachedOrFetch('grades', options.config.cache.grades * 60 * 60 * 1000, () => fetchGradesFor(user, from, to))
}

async function getAbsencesFor(user: FullUser, from: Date, to: Date, options: Options) {
	return getCachedOrFetch('absences', options.config.cache.absences * 60 * 60 * 1000, () => fetchAbsencesFor(user, from, to))
}

async function getSchoolYears(user: FullUser, options: Options) {
	return getCachedOrFetch('school_years', options.config.cache.schoolYears * 60 * 60 * 1000, () => fetchSchoolYears(user))
}

async function getTimetable(user: FullUser, options: Options) {
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
		const firstDate = new Date(sortedKeys[0])
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

//#endregion

//#region Comparing

function asNumericTime(date: Date) {
	return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

function asWeekday(date: Date) {
	return date.toLocaleDateString(LOCALE, { weekday: 'long' })
}

function compareCachedLessons(lessonWeek: TransformedLessonWeek, cachedLessonWeek: TransformedLessonWeek) {
	console.log('Comparing cached lessons with fetched lessons.')
	// exit if all lessons are the same
	if (JSON.stringify(lessonWeek) === JSON.stringify(cachedLessonWeek)) {
		console.log('All lessons are the same.')
		return true
	}

	// loop over the days
	for (const dayKey in lessonWeek) {
		const lessons = lessonWeek[dayKey]
		const cachedLessons = cachedLessonWeek[dayKey]

		if (!cachedLessons) {
			console.log(`No cached lessons for ${dayKey}.`)
			continue
		}

		// check if the lessons for this day are the same
		if (JSON.stringify(lessons) === JSON.stringify(cachedLessons)) {
			console.log(`Lessons for ${dayKey} are the same.`)
			continue
		}

		// loop over the lessons
		for (const lesson of lessons) {
			const subjectTitle = getSubjectTitle(lesson, false)
			const dayString = lesson.from.toLocaleDateString(LOCALE, { weekday: 'long' })

			// check if the lesson is in the cached lessons
			const cachedLesson = cachedLessons.find((l) => l.id === lesson.id)
			if (!cachedLesson) {
				// only notify here if the lesson was not rescheduled
				if (!lesson.isRescheduled) {
					console.log(`Lesson ${lesson.id} is new.`)
					scheduleNotification(`${subjectTitle} was added`, `${subjectTitle} was added on ${dayString}`)
				}
				continue
			}

			// check if the lesson has changed
			if (JSON.stringify(lesson) === JSON.stringify(cachedLesson)) {
				continue
			}

			// info, note, text, isRescheduled, state, rooms, subject, teachers

			if (lesson.info !== cachedLesson.info) {
				scheduleNotification(`Info for ${subjectTitle} changed`, `on ${dayString}: "${lesson.info}"`)
				continue
			}

			if (lesson.note !== cachedLesson.note) {
				scheduleNotification(`Note for ${subjectTitle} changed`, `on ${dayString}: "${lesson.note}"`)
				continue
			}

			if (lesson.text !== cachedLesson.text) {
				scheduleNotification(`Text for ${subjectTitle} changed`, `on ${dayString}: "${lesson.text}"`)
				continue
			}

			if (lesson.isRescheduled !== cachedLesson.isRescheduled) {
				// only notify for the source
				if (!lesson.rescheduleInfo.isSource) continue

				// if the day is the same
				if (lesson.rescheduleInfo.otherFrom.getDate() === lesson.rescheduleInfo.otherTo.getDate()) {
					scheduleNotification(
						`${dayString}: ${subjectTitle} was shifted`,
						`from ${asNumericTime(lesson.from)} to ${asNumericTime(lesson.rescheduleInfo.otherFrom)}`
					)
					continue
				}

				scheduleNotification(
					`${dayString}: ${subjectTitle} was rescheduled`,
					`from ${asWeekday(lesson.rescheduleInfo.otherFrom)} to ${asWeekday(lesson.rescheduleInfo.otherTo)}`
				)
				continue
			}

			if (lesson.state !== cachedLesson.state) {
				switch (lesson.state) {
					case LessonState.CANCELED:
					case LessonState.FREE:
						scheduleNotification(
							`${dayString}: ${subjectTitle} was cancelled`,
							`${subjectTitle} @ ${asNumericTime(lesson.from)} was cancelled`
						)
						break
					// TODO: substitutions
				}
				continue
			}
		}
	}
}

//#endregion

//#region Login

async function login(user: UserData, password: string) {
	console.log(`🔑 Logging in as ${user.username} in school ${user.school} on ${user.server}.webuntis.com`)

	const cookies = await fetchCookies(user, password)
	const token = await fetchBearerToken(user, cookies)
	const fullUser = await fetchUserData({ ...user, cookies, token })

	console.log(
		`🔓 Logged in as ${fullUser.displayName} (${fullUser.username}) in school ${fullUser.school} on ${fullUser.server}.webuntis.com`
	)

	return fullUser
}

async function fetchCookies(user: UserData, password: string) {
	const credentialBody = `school=${user.school}&j_username=${user.username}&j_password=${password}&token=`
	const jSpringUrl = `https://${user.server}.webuntis.com/WebUntis/j_spring_security_check`

	const request = new Request(jSpringUrl)
	request.method = 'POST'
	request.body = credentialBody
	request.headers = {
		Accept: 'application/json',
		'Content-Type': 'application/x-www-form-urlencoded',
	}

	await request.load()

	if (request.response.statusCode == 404) {
		throwError(ErrorCode.NOT_FOUND)
	}

	const cookies = request.response.cookies.map((cookie: any) => `${cookie.name}=${cookie.value}`)

	if (!cookies) {
		throwError(ErrorCode.NO_COOKIES)
	}

	console.log('🍪 Got cookies')

	return cookies
}

async function fetchBearerToken(user: UserData, cookies: string[]) {
	const url = `https://${user.server}.webuntis.com/WebUntis/api/token/new`

	const request = new Request(url)
	request.headers = {
		cookie: cookies.join(';'),
	}

	const token = await request.loadString()

	// throw a LOGIN_ERROR if the response contains the string "loginError"
	if (token.includes('loginError')) {
		throwError(ErrorCode.LOGIN_ERROR)
	}

	if (!token) {
		throwError(ErrorCode.NO_TOKEN)
	}

	console.log('🎟️  Got Bearer Token for Authorization')

	return token
}

async function fetchUserData(user: User) {
	const url = `https://${user.server}.webuntis.com/WebUntis/api/rest/view/v1/app/data`

	const request = new Request(url)
	request.headers = {
		Authorization: `Bearer ${user.token}`,
	}

	const json = await request.loadJSON()

	if (!json || !json.user) {
		throwError(ErrorCode.NO_USER)
	}

	if (json.user.name !== user.username) {
		console.warn(`Username mismatch: ${json.user.name} !== ${user.username}`)
	}

	const fullUser: FullUser = {
		server: user.server,
		school: user.school,
		id: json.user.person.id,
		username: user.username,
		displayName: json.user.person.displayName,
		imageUrl: json.user.person.imageUrl,
		token: user.token,
		cookies: user.cookies,
	}

	console.log(`👤 Got data for user ${fullUser.username} (id: ${fullUser.id}).\n`)

	return fullUser
}

//#endregion

//#region Transforming

function parseDateNumber(date: number) {
	const dateStr = date.toString()
	const year = dateStr.slice(0, 4)
	const month = dateStr.slice(4, 6)
	const day = dateStr.slice(6, 8)
	return new Date(`${year}-${month}-${day}`)
}

function parseTimeNumber(time: number) {
	const timeStr = time.toString().padStart(4, '0')
	const hours = timeStr.slice(0, 2)
	const minutes = timeStr.slice(2, 4)
	return new Date(`1970-01-01T${hours}:${minutes}`)
}

/**
 * Adds the necessary leading 0s, and combines date and time to a new JS Date object
 * @param date the date as a number, e.g. 20220911
 * @param time the time as a number, e.g. 830
 */
function combineDateAndTime(date: number, time: number) {
	const parsedDate = parseDateNumber(date)
	const parsedTime = parseTimeNumber(time)
	return new Date(parsedDate.getTime() + parsedTime.getTime())
}

function transformLessons(lessons: Lesson[], elements: Element[], config: Config): TransformedLessonWeek {
	const transformedLessonWeek: TransformedLessonWeek = {}

	// transform each lesson
	for (const lesson of lessons) {
		// get the linked elements from the list
		const resolvedElements = resolveElements(lesson, elements)
		if (!resolvedElements) {
			console.log(`Could not resolve elements for lesson ${lesson.lessonId}`)
			continue
		}
		const { groups, teachers, subject, rooms } = resolvedElements

		// create the transformed lesson
		const transformedLesson: TransformedLesson = {
			id: lesson.id,

			note: lesson.lessonText,
			text: lesson.periodText,
			info: lesson.periodInfo,
			substitutionText: lesson.substText,

			from: combineDateAndTime(lesson.date, lesson.startTime),
			to: combineDateAndTime(lesson.date, lesson.endTime),

			// get all the elements with the matching type (1), and transform them
			group: groups[0],
			teachers: teachers,
			subject: subject,
			rooms: rooms,

			// TODO: add specific teacher substitution
			state: lesson.cellState,
			isEvent: lesson.is.event,
			isRescheduled: 'rescheduleInfo' in lesson,

			duration: 1, // incremented when combining lessons
		}

		// add the reschedule info if it exists
		if ('rescheduleInfo' in lesson && lesson.rescheduleInfo) {
			transformedLesson.rescheduleInfo = {
				isSource: lesson.rescheduleInfo.isSource,
				otherFrom: combineDateAndTime(lesson.rescheduleInfo.date, lesson.rescheduleInfo.startTime),
				otherTo: combineDateAndTime(lesson.rescheduleInfo.date, lesson.rescheduleInfo.endTime),
			}
		}

		// add the exam info if it exists
		if ('exam' in lesson && lesson.exam) {
			transformedLesson.exam = {
				name: lesson.exam.name,
				markSchemaId: lesson.exam.markSchemaId,
			}
		}

		// add the lesson with the date as key
		const dateKey = transformedLesson.from.toISOString().split('T')[0]
		if (!transformedLessonWeek[dateKey]) {
			transformedLessonWeek[dateKey] = []
		}

		applyCustomLessonConfig(transformedLesson, config)

		transformedLessonWeek[dateKey].push(transformedLesson)
	}

	console.log('Sorting...')

	// sort the lessons by start time
	for (const dateKey in transformedLessonWeek) {
		transformedLessonWeek[dateKey].sort((a, b) => a.from.getTime() - b.from.getTime())
	}

	let combinedLessonWeek: TransformedLessonWeek = {}
	// combine lessons which are equal and are directly after each other
	for (const dateKey in transformedLessonWeek) {
		combinedLessonWeek[dateKey] = combineLessons(transformedLessonWeek[dateKey], config)
	}

	return combinedLessonWeek
}

function resolveStatelessElement(id: number, type: number, availableElements: Element[]): StatelessElement {
	const foundElement = availableElements.find((element) => element.id === id && element.type === type)
	const elementBase: StatelessElement = {
		id: id,
		name: foundElement?.name,
	}

	if (!foundElement) return

	if (foundElement.type === ElementType.TEACHER) {
		return elementBase
	}

	const element = elementBase as ExtendedTransformedElement
	element.longName = foundElement.longName

	if (foundElement.type === ElementType.ROOM) {
		const room = element as Room
		room.capacity = foundElement.roomCapacity
		return room
	}

	return element
}

function resolveElement(unresolvedElement: UnresolvedElement, availableElements: Element[]) {
	const statelessElement = resolveStatelessElement(unresolvedElement.id, unresolvedElement.type, availableElements)

	const element = statelessElement as StatefulElement
	element.state = unresolvedElement.state

	if (unresolvedElement.orgId) {
		const originalElement = resolveStatelessElement(unresolvedElement.orgId, unresolvedElement.type, availableElements)
		element.original = originalElement
	}

	return element
}

function resolveElements(lesson: Lesson, elements: Element[]) {
	const groups: Group[] = []
	const teachers: Teacher[] = []
	let subject: Subject | undefined
	const rooms: Room[] = []

	for (const unresolvedElement of lesson.elements) {
		const element = resolveElement(unresolvedElement, elements)

		if (!element) {
			console.warn(`Could not find element ${unresolvedElement.id} with type ${unresolvedElement.type}`)
			continue
		}

		if (unresolvedElement.type === ElementType.TEACHER) {
			teachers.push(element as Teacher)
			continue
		}

		switch (unresolvedElement.type) {
			case ElementType.GROUP:
				groups.push(element as Group)
				break
			case ElementType.SUBJECT:
				if (subject) {
					console.error(`Found multiple subjects for lesson ${lesson.lessonId}`)
				}
				subject = element as Subject
				break
			case ElementType.ROOM:
				rooms.push(element as Room)
				break
			default:
				console.error(`Unknown element type ${unresolvedElement.type}`)
				break
		}
	}

	return { groups, teachers, subject, rooms }
}

/**
 * Combines some of the given lessons, if they are directly after each other and have the same properties.
 * @param lessons
 * @param ignoreDetails if true, only the subject and time will be considered
 */
function combineLessons(lessons: TransformedLesson[], config: Config, ignoreDetails = false, ignoreBreaks = false) {
	const combinedLessonsNextDay: TransformedLesson[] = []
	for (const [index, lesson] of lessons.entries()) {
		const previousLesson = combinedLessonsNextDay[combinedLessonsNextDay.length - 1]

		if (
			index !== 0 &&
			previousLesson &&
			shouldCombineLessons(previousLesson, lesson, config, ignoreDetails, ignoreBreaks)
		) {
			previousLesson.to = lesson.to
			previousLesson.duration++
		} else {
			combinedLessonsNextDay.push(lesson)
		}
	}
	return combinedLessonsNextDay
}

function transformExams(exams: Exam[]) {
	const transformedExams: TransformedExam[] = []

	for (const exam of exams) {
		const transformedExam: TransformedExam = {
			name: exam.name,
			type: exam.examType,
			from: combineDateAndTime(exam.examDate, exam.startTime),
			to: combineDateAndTime(exam.examDate, exam.endTime),
			subject: exam.subject,
			teacherNames: exam.teachers,
			roomNames: exam.rooms,
		}

		transformedExams.push(transformedExam)
	}

	return transformedExams
}

function transformGrades(grades: Grade[]) {
	const transformedGrades: TransformedGrade[] = []
	for (const grade of grades) {
		const transformedGrade: TransformedGrade = {
			subject: grade.subject,
			date: parseDateNumber(grade.grade.date),
			lastUpdated: new Date(grade.grade.lastUpdate),
			text: grade.grade.text,
			schemaId: grade.grade.markSchemaId,

			mark: {
				displayValue: grade.grade.mark.markDisplayValue,
				name: grade.grade.mark.name,
				id: grade.grade.mark.id,
			},

			examType: {
				name: grade.grade.examType.name,
				longName: grade.grade.examType.longname,
			},
		}

		if (grade.grade.exam) {
			transformedGrade.exam = {
				name: grade.grade.exam.name,
				id: grade.grade.exam.id,
				date: parseDateNumber(grade.grade.exam.date),
			}
		}

		transformedGrades.push(transformedGrade)
	}
	return transformedGrades
}

function transformAbsences(absences: Absence[]) {
	const transformedAbsences: TransformedAbsence[] = []
	for (const absence of absences) {
		const transformedAbsence: TransformedAbsence = {
			from: combineDateAndTime(absence.startDate, absence.startTime),
			to: combineDateAndTime(absence.endDate, absence.endTime),
			createdBy: absence.createdUser,
			reasonId: absence.reasonId,
			isExcused: absence.isExcused,
			excusedBy: absence.excuse.username,
		}
		transformedAbsences.push(transformedAbsence)
	}
	return transformedAbsences
}

function transformClassRoles(classRoles: ClassRole[]) {
	const transformedClassRoles: TransformedClassRole[] = []
	for (const classRole of classRoles) {
		const transformedClassRole: TransformedClassRole = {
			fromDate: parseDateNumber(classRole.startDate),
			toDate: parseDateNumber(classRole.endDate),
			firstName: classRole.foreName,
			lastName: classRole.longName,
			dutyName: classRole.duty.label,
		}
		transformedClassRoles.push(transformedClassRole)
	}
	return transformedClassRoles
}

async function transformSchoolYears(schoolYears: SchoolYear[]) {
	const transformedSchoolYears: TransformedSchoolYear[] = []
	for (const schoolYear of schoolYears) {
		const transformedSchoolYear: TransformedSchoolYear = {
			name: schoolYear.name,
			id: schoolYear.id,
			from: new Date(schoolYear.dateRange.start),
			to: new Date(schoolYear.dateRange.end),
		}
		transformedSchoolYears.push(transformedSchoolYear)
	}
	return transformedSchoolYears
}

//#endregion

//#endregion

//#region Options

//#region Colors

const unparsedColors = {
	background: {
		primary: '#222629',

		red: '#461E1E',
		orange: '#4E2B03',
		yellow: '#544318',
		lime: '#354611',
		green: '#234010',
		darkGreen: '#1F3221',
		turquoise: '#114633',
		lightBlue: '#0E4043',
		blue: '#222B4A',
		lavender: '#33254F',
		purple: '#3F2156',
		pink: '#4A183F',
		brown: '#37291B',
	},
	text: {
		primary: '#E0EAEF',
		secondary: '#A7B4B8',
		disabled: '#687277',
		red: '#BA4747',
		event: '#DD9939',
	},
}

type UnparsedColors = typeof unparsedColors
type Colors = { [key in keyof UnparsedColors]: { [nestedKey in keyof UnparsedColors[key]]: Color } }

function parseColors(input: UnparsedColors): Colors {
	// go through the colors and parse them
	const colors: any = {}
	for (const key in input) {
		colors[key] = {} as any
		const values = input[key as keyof UnparsedColors]
		for (const nestedKey in values) {
			colors[key][nestedKey] = new Color(values[nestedKey as keyof typeof values])
		}
	}

	return colors
}

const colors = parseColors(unparsedColors)

function getColor(name: string) {
	if (!(name in colors.background)) {
		// check if it is a hex color
		if (/^#?([\da-f]{3}){1,2}$/i.test(name)) {
			return new Color(name)
		}
		console.log(`Color ${name} not found`)
		return colors.background.primary
	}
	return new Color(unparsedColors.background[name as keyof typeof unparsedColors.background])
}

//#endregion

//#region Config

interface SingleLessonOption {
	color: string
	longNameOverride?: string
	ignoreInfo?: string[]
	subjectOverride?: string
}

interface TeacherSpecificLessonOption extends SingleLessonOption {
	teacher: string
}

type LessonOptions = {
	[key: string]: SingleLessonOption | TeacherSpecificLessonOption[]
}

interface Options extends Config {
	useICloud: boolean
	appDirectory: string
}

const defaultConfig = {
	lessonOptions: {
		SubjectShortName: {
			color: 'orange',
			subjectOverride: 'CustomSubjectName',
			longNameOverride: 'SubjectLongName',
			ignoreInfo: ['InfoTagWhichShouldBeIgnored'],
		},
		SubjectShortName2: [
			{
				teacher: 'TeacherForWhichThisShouldBeApplied',
				color: 'blue',
				subjectOverride: 'CustomSubjectName',
				longNameOverride: 'SubjectLongName',
				ignoreInfo: ['InfoTagWhichShouldBeIgnored'],
			},
		],
	} as LessonOptions,

	config: {
		locale: 'de-AT',
		breakMin: 7,
		breakMax: 45,
		refreshing: {
			normalScope: 12,
			normalInterval: 60,
			lazyInterval: 4,
		},
		cache: {
			user: 0.25,
			lessons: 0.5,
			exams: 24,
			grades: 8,
			absences: 24,
			schoolYears: 24,
		},
	},

	views: {
		lessons: {
			maxCount: 8,
		},
		exams: {
			maxCount: 3,
			scopeDays: 7,
		},
		grades: {
			maxCount: 1,
			scopeDays: 7,
		},
		absences: {
			maxCount: 3,
		},
	},

	appearance: {
		cornerRadius: 4,
		spacing: 6,
		padding: 8,
	},
	summary: {
		showMultiplier: true,
	},
	footer: {
		show: true,
	},
}

type Config = typeof defaultConfig

//#endregion

//#endregion

//#region Views

//#region Absences

function addViewAbsences(
	absences: TransformedAbsence[],
	count: number,
	{ container, width, height }: ViewBuildData,
	options: Options
) {
	let remainingHeight = height
	const lineHeight = getCharHeight(14)
	const padding = 4

	if (height < lineHeight + 2 * padding) return 0

	// add the remaining lessons until the max item count is reached
	for (let i = 0; i < absences.length; i++) {
		const absence = absences[i]

		if (absence.isExcused) continue

		const absenceContainer = container.addStack()
		absenceContainer.layoutHorizontally()
		absenceContainer.spacing = options.appearance.spacing
		absenceContainer.backgroundColor = colors.background.primary
		absenceContainer.cornerRadius = options.appearance.cornerRadius

		const flowLayoutRow = new FlowLayoutRow(
			width,
			remainingHeight,
			options.appearance.cornerRadius,
			padding,
			absenceContainer
		)

		flowLayoutRow.addIcon('pills.circle', 14, colors.text.secondary)

		// if the absence is not longer than one day, show the date and duration
		if (absence.to.getDate() === absence.from.getDate() && absence.to.getMonth() === absence.from.getMonth()) {
			const fromDate = absence.from.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' })
			flowLayoutRow.addText(fromDate, Font.mediumSystemFont(14), 14, colors.text.primary)

			// the duration in minutes
			const duration = (absence.to.getTime() - absence.from.getTime()) / 1000 / 60
			const hours = Math.floor(duration / 60).toString()
			const minutes = Math.floor(duration % 60)
				.toString()
				.padStart(2, '0')
			// the duration as hh:mm
			const durationString = `${hours}h${minutes}`
			flowLayoutRow.addText(durationString, Font.mediumSystemFont(14), 14, colors.text.secondary)
		}
		// if the absence is longer than one day, show the start and end date as "dd.mm - dd.mm"
		else {
			const from = absence.from.toLocaleString(LOCALE, { day: 'numeric', month: 'short' })
			const to = absence.to.toLocaleString(LOCALE, { day: 'numeric', month: 'short' })
			flowLayoutRow.addText(from, Font.mediumSystemFont(14), 14, colors.text.primary)
			flowLayoutRow.addText('-', Font.mediumSystemFont(14), 14, colors.text.secondary)
			flowLayoutRow.addText(to, Font.mediumSystemFont(14), 14, colors.text.primary)
		}

		const { resultingWidth, resultingHeight } = flowLayoutRow.finish()

		remainingHeight -= resultingHeight + options.appearance.spacing

		// exit if the max item count is reached
		if (count && i >= count - 1) break

		// exit if it would get too big, use the maximum height
		if (remainingHeight - 2 * lineHeight + options.appearance.spacing < 0) break
	}

	return height - remainingHeight
}

//#endregion

//#region Exams

function addViewExams(exams: TransformedExam[], count: number, { container, width, height }: ViewBuildData, config: Config) {
	let remainingHeight = height
	const lineHeight = getCharHeight(14)
	const padding = 4

	if (height < lineHeight + 2 * padding) return 0

	const sortedExams = exams.sort((a, b) => a.from.getTime() - b.from.getTime())

	// add the remaining lessons until the max item count is reached
	for (let i = 0; i < sortedExams.length; i++) {
		const exam = sortedExams[i]

		// continue if the exam has already passed
		if (exam.to < CURRENT_DATETIME) continue

		const examContainer = container.addStack()
		examContainer.layoutHorizontally()
		examContainer.spacing = config.appearance.spacing
		examContainer.backgroundColor = colors.background.primary
		examContainer.cornerRadius = config.appearance.cornerRadius

		const flowLayoutRow = new FlowLayoutRow(width, remainingHeight, config.appearance.spacing, padding, examContainer)

		flowLayoutRow.addIcon('book.circle', 14, colors.text.secondary)

		flowLayoutRow.addText(exam.subject, Font.mediumSystemFont(14), 14, colors.text.primary)

		flowLayoutRow.addText(exam.type, Font.mediumSystemFont(14), 14, colors.text.secondary)

		const date = exam.from.toLocaleString(LOCALE, { day: 'numeric', month: 'short' })
		flowLayoutRow.addText(date, Font.regularSystemFont(14), 14, colors.text.secondary)

		const { resultingWidth, resultingHeight } = flowLayoutRow.finish()

		remainingHeight -= resultingHeight + config.appearance.spacing

		// exit if the max item count is reached
		if (count && i >= count - 1) break

		// exit if it would get too big, use the maximum height
		if (remainingHeight - 3 * lineHeight + 2 * config.appearance.spacing < 0) break
	}

	return height - remainingHeight
}

//#endregion

//#region Grades

function addViewGrades(
	grades: TransformedGrade[],
	count: number,
	{ container, width, height }: ViewBuildData,
	options: Options
) {
	let remainingHeight = height
	const lineHeight = getCharHeight(14)
	const padding = 4

	if (height < lineHeight + 2 * padding) return 0

	// sort the grades by date (newest first)
	const sortedGrades = grades.sort((a, b) => b.date.getTime() - a.date.getTime())

	// add the remaining lessons until the max item count is reached
	for (let i = 0; i < sortedGrades.length; i++) {
		const grade = sortedGrades[i]

		const gradeContainer = container.addStack()
		gradeContainer.layoutHorizontally()
		gradeContainer.spacing = options.appearance.spacing
		gradeContainer.backgroundColor = colors.background.primary
		gradeContainer.cornerRadius = options.appearance.cornerRadius

		const flowLayoutRow = new FlowLayoutRow(width, remainingHeight, options.appearance.spacing, padding, gradeContainer)

		let usingIcon = true
		let symbolName = 'circle'

		if (grade.schemaId === 1) {
			// 1 - 5
			symbolName = `${grade.mark.displayValue}.circle`
		} else if (grade.schemaId === 3) {
			// +, ~, -
			if (grade.mark.displayValue === 1) symbolName = 'plus.square'
			else if (grade.mark.displayValue === 2) symbolName = 'equal.square'
			else if (grade.mark.displayValue === 3) symbolName = 'minus.square'
		} else if (grade.schemaId === 24) {
			// ++, +, ~, -
			if (grade.mark.displayValue === 1) symbolName = 'cross.circle'
			else if (grade.mark.displayValue === 2) symbolName = 'plus.circle'
			else if (grade.mark.displayValue === 3) symbolName = 'equal.circle'
			else if (grade.mark.displayValue === 4) symbolName = 'minus.circle'
		} else {
			usingIcon = false
		}

		if (usingIcon) {
			flowLayoutRow.addIcon(symbolName, 14, colors.text.primary)
		} else {
			flowLayoutRow.addText(grade.mark.name, Font.mediumSystemFont(14), 14, colors.text.primary)
		}

		flowLayoutRow.addText(grade.subject, Font.mediumSystemFont(14), 14, colors.text.primary)

		flowLayoutRow.addText(grade.examType.name, Font.regularSystemFont(14), 14, colors.text.secondary)

		const { resultingWidth, resultingHeight } = flowLayoutRow.finish()

		remainingHeight -= resultingHeight + options.appearance.spacing

		// exit if the max item count is reached
		if (count && i >= count - 1) break

		// exit if it would get too big, use the maximum height
		if (remainingHeight - 3 * lineHeight + 2 * options.appearance.spacing < 0) break
	}

	return height - remainingHeight
}

//#endregion

//#region Lessons

function addViewLessons(
	lessons: TransformedLesson[],
	count: number | undefined,
	{ container, width, height }: ViewBuildData,
	config: Config
) {
	// only allow up to x items to avoid overflow
	let itemCount = 0
	const lessonHeight = getCharHeight(14) + 8

	let remainingHeight = height

	// add the remaining lessons until the max item count is reached
	for (let i = 0; i < lessons.length; i++) {
		const previousLesson = lessons[i - 1]
		const lesson = lessons[i]

		// if the gap between the previous lesson and this lesson is too big, add a break
		if (previousLesson && lesson.from.getTime() - previousLesson.to.getTime() > config.config.breakMax * 60 * 1000) {
			addBreak(container, previousLesson.to, config)
			itemCount++
			remainingHeight -= lessonHeight + config.appearance.spacing
			if ((count && itemCount >= count) || remainingHeight - lessonHeight < 0) break
		}

		// only show the time if the previous lesson didn't start at the same time
		const showTime = !previousLesson || previousLesson.from.getTime() !== lesson.from.getTime()
		const useSubjectLongName = width > getCharWidth(14) * 20
		addWidgetLesson(lesson, container, config, showTime, useSubjectLongName)
		itemCount++
		remainingHeight -= lessonHeight + config.appearance.spacing

		// exit if the max item count is reached
		if (count && itemCount >= count) break
		// exit if it would get too big
		if (remainingHeight - lessonHeight < 0) break
	}

	return height - remainingHeight
}

//#endregion

//#region Preview

function addViewPreview(
	lessons: TransformedLesson[],
	nextDayKey: string,
	{ container, width, height }: ViewBuildData,
	config: Config
) {
	const titleHeight = getCharHeight(14)
	const subjectHeight = getCharHeight(14) + 8
	let currentHeight = 0

	// add information about the next day if there is enough space
	if (lessons && height > titleHeight) {
		addPreviewTitle(container, lessons, nextDayKey, width)
		currentHeight += titleHeight + config.appearance.spacing

		// TODO: might cause overflow, as the height is not checked
		if (height - currentHeight > subjectHeight) {
			currentHeight +=
				addPreviewList(container, lessons, config, width, height - currentHeight).resultingHeight +
				config.appearance.spacing
		}
	}
	return currentHeight
}

function addPreviewTitle(container: ListWidget | WidgetStack, lessons: TransformedLesson[], nextDayKey: string, width: number) {
	const nextDayHeader = container.addStack()
	nextDayHeader.layoutHorizontally()
	nextDayHeader.spacing = 4
	nextDayHeader.bottomAlignContent()

	// get the weekday string
	const useLongName = width > 22 * getCharWidth(14)
	const weekdayFormat = useLongName ? 'long' : 'short'
	const title = nextDayHeader.addText(new Date(nextDayKey).toLocaleDateString(LOCALE, { weekday: weekdayFormat }) + ':')
	title.font = Font.semiboldSystemFont(14)
	title.textColor = colors.text.primary
	title.lineLimit = 1

	nextDayHeader.addSpacer()

	// show from when to when the next day takes place
	// filter out lessons which don't take place
	const lessonsNextDay = lessons.filter((lesson) => {
		if (lesson.state === LessonState.FREE || lesson.state === LessonState.CANCELED) return false
		if (lesson.state === LessonState.RESCHEDULED && lesson.rescheduleInfo?.isSource) return false
		return true
	})
	const dayFrom = lessonsNextDay[0].from
	const dayFromString = dayFrom.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: 'numeric' })
	const dayTo = lessonsNextDay[lessonsNextDay.length - 1].to
	const dayToString = dayTo.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: 'numeric' })

	const fromToText = nextDayHeader.addText(`${dayFromString} - ${dayToString}`)
	fromToText.font = Font.mediumSystemFont(14)
	fromToText.textColor = colors.text.primary
}

function addPreviewList(container: WidgetStack, lessons: TransformedLesson[], config: Config, width: number, height: number) {
	// combine lessons if they have the same subject and are after each other
	const combinedLessonsNextDay = combineLessons(lessons, config, true, true)

	const spacing = 4

	// add a container for the list of subjects
	const subjectListContainer = container.addStack()
	subjectListContainer.layoutVertically()
	subjectListContainer.spacing = spacing

	const padding = 4

	const flowLayoutRow = new FlowLayoutRow(width, height, config.appearance.spacing, 0, subjectListContainer)

	for (const lesson of combinedLessonsNextDay) {
		// skip the subject if it is 'free'
		if (lesson.state === LessonState.FREE) continue

		let subjectWidth = getTextWidth(getSubjectTitle(lesson), 14) + 2 * padding
		if (config.summary.showMultiplier && lesson.duration > 1) {
			subjectWidth += getTextWidth('x2', 14) + spacing
		}

		const subjectContainer = flowLayoutRow.addContainer(subjectWidth, getCharHeight(15) + 8, true)

		if (subjectContainer) {
			convertToSubject(lesson, subjectContainer, config)
		}
	}

	return flowLayoutRow.finish()
}

//#endregion

//#endregion

//#region Helpers

//#region Build Helpers

/**
 * Adds a SFSymbol with the correct outer size to match the font size.
 */
function addSymbol(name: string, to: WidgetStack | ListWidget, options: { color: Color; size: number; outerSize?: number }) {
	const icon = SFSymbol.named(name)
	icon.applyFont(Font.mediumSystemFont(options.size))
	const iconImage = to.addImage(icon.image)
	const outerSize = options.outerSize ?? 1.1 * options.size
	iconImage.imageSize = new Size(outerSize, outerSize)
	iconImage.resizable = false
	iconImage.tintColor = options.color
}

/**
 * Adds a break to the widget.
 */
function addBreak(to: WidgetStack | ListWidget, breakFrom: Date, config: Config) {
	const breakContainer = makeTimelineEntry(to, breakFrom, true, colors.background.primary, config)
	const breakTitle = breakContainer.addText('Break')
	breakTitle.font = Font.mediumSystemFont(14)
	breakTitle.textColor = colors.text.secondary
	breakContainer.addSpacer()
}

function makeTimelineEntry(
	to: WidgetStack | ListWidget,
	time: Date,
	showTime: boolean,
	backgroundColor: Color,
	config: Config
) {
	const lessonWrapper = to.addStack()
	lessonWrapper.layoutHorizontally()
	lessonWrapper.spacing = config.appearance.spacing

	const lessonContainer = lessonWrapper.addStack()
	lessonContainer.backgroundColor = backgroundColor
	lessonContainer.layoutHorizontally()
	lessonContainer.setPadding(4, 4, 4, 4)
	lessonContainer.cornerRadius = config.appearance.cornerRadius

	if (showTime) {
		const dateWrapper = lessonWrapper.addStack()
		dateWrapper.backgroundColor = backgroundColor
		dateWrapper.setPadding(4, 4, 4, 4)
		dateWrapper.cornerRadius = config.appearance.cornerRadius
		dateWrapper.size = new Size(48, getCharHeight(14) + 8)

		const date = dateWrapper.addDate(new Date(time))
		date.font = Font.mediumSystemFont(14)
		date.textColor = colors.text.primary
		date.rightAlignText()
		date.applyTimeStyle()
	}

	return lessonContainer
}

function addWidgetLesson(
	lesson: TransformedLesson,
	to: ListWidget | WidgetStack,
	config: Config,
	showTime = true,
	useSubjectLongName = false
) {
	const isCanceled = lesson.state === LessonState.CANCELED
	const isCanceledOrFree = isCanceled || lesson.state === LessonState.FREE
	const isRescheduled = lesson.state === LessonState.RESCHEDULED && lesson.rescheduleInfo?.isSource

	// define the colors
	let backgroundColor = getColor(lesson.backgroundColor)
	let textColor = colors.text.primary
	let iconColor: Color = colors.text.secondary

	// adjust the colors for canceled lessons and similar
	if (lesson.state === LessonState.CANCELED || lesson.state === LessonState.FREE || isRescheduled) {
		backgroundColor = colors.background.primary
		textColor = colors.text.disabled
		iconColor = colors.text.disabled
	}

	// add the entry with the time
	const lessonContainer = makeTimelineEntry(to, lesson.from, showTime, backgroundColor, config)
	lessonContainer.spacing = config.appearance.spacing

	// add the name of the subject
	const lessonText = lessonContainer.addText(getSubjectTitle(lesson, useSubjectLongName))
	lessonText.font = Font.semiboldSystemFont(14)
	lessonText.textColor = textColor
	lessonText.leftAlignText()
	lessonText.lineLimit = 1

	// add a x2 for double lessons etc.
	if (lesson.duration > 1) {
		const durationText = lessonContainer.addText(`x${lesson.duration}`)
		durationText.font = Font.mediumSystemFont(14)
		durationText.textColor = isCanceled ? colors.text.disabled : colors.text.secondary
	}

	let iconName: string | undefined = undefined

	// add icons for the lesson state
	if (lesson.isEvent) {
		iconName = 'calendar.circle'
	} else if (isCanceledOrFree && !lesson.isRescheduled) {
		iconName = 'xmark.circle'
		if (isCanceled) iconColor = colors.text.red
	} else if (lesson.state === LessonState.ADDITIONAL) {
		iconName = 'plus.circle'
	} else if (lesson.state === LessonState.RESCHEDULED) {
		iconName = 'calendar.circle'
	} else if (lesson.state === LessonState.EXAM) {
		iconName = 'book.circle'
	} else if (lesson.state === LessonState.SUBSTITUTED) {
		iconName = 'person.circle'
	} else if (lesson.state === LessonState.ROOM_SUBSTITUTION) {
		iconName = 'location.circle'
	} else if (lesson.state === LessonState.FREE) {
		iconName = 'bell.circle'
	} else if (lesson.text || lesson.info || lesson.note) {
		iconName = 'info.circle'
	}

	if (!iconName) {
		lessonContainer.addSpacer()
	}

	if (lesson.isRescheduled && lesson.rescheduleInfo?.isSource) {
		addSymbol('arrow.right', lessonContainer, {
			color: isCanceled ? colors.text.disabled : colors.text.secondary,
			size: 10,
		})
		// display the time it was rescheduled to
		// const rescheduledTimeWrapper = lessonContainer.addStack()
		const rescheduledTime = lessonContainer.addDate(lesson.rescheduleInfo?.otherFrom)
		rescheduledTime.font = Font.mediumSystemFont(14)
		rescheduledTime.textColor = isCanceled ? colors.text.disabled : colors.text.secondary
		rescheduledTime.applyTimeStyle()
	}

	if (iconName) {
		// TODO: this does not work properly (min width?) - e.g. 2022-09-19
		lessonContainer.addSpacer()
		addSymbol(iconName, lessonContainer, { color: iconColor, size: 14 })
	}
}

function convertToSubject(lesson: TransformedLesson, container: WidgetStack, config: Config) {
	let backgroundColor = getColor(lesson.backgroundColor)
	let textColor = colors.text.primary

	// apply the colors for canceled lessons and similar
	if (lesson.state === LessonState.CANCELED) {
		backgroundColor = colors.background.primary
		textColor = colors.text.red
	} else if (lesson.state === LessonState.FREE) {
		backgroundColor = colors.background.primary
		textColor = colors.text.disabled
	} else if (lesson.state === LessonState.RESCHEDULED) {
		// only show as primary if it is not the source -> it is the one that takes place
		if (lesson.rescheduleInfo?.isSource) {
			backgroundColor = colors.background.primary
			textColor = colors.text.disabled
		} else {
			backgroundColor = colors.background.primary
			textColor = colors.text.primary
		}
	} else if (lesson.isEvent) {
		backgroundColor = colors.background.primary
		textColor = colors.text.event
	}

	container.backgroundColor = backgroundColor
	container.layoutHorizontally()
	container.setPadding(4, 4, 4, 4)
	container.cornerRadius = config.appearance.cornerRadius
	container.spacing = config.appearance.spacing

	// add the name of the subject
	const subjectText = container.addText(getSubjectTitle(lesson))
	subjectText.font = Font.mediumSystemFont(14)
	subjectText.textColor = textColor
	subjectText.leftAlignText()
	subjectText.minimumScaleFactor = 1
	subjectText.lineLimit = 1

	// add a x2 for double lessons etc.
	if (config.summary.showMultiplier && lesson.duration > 1) {
		const durationText = container.addText(`x${lesson.duration}`)
		durationText.font = Font.mediumSystemFont(14)
		durationText.textColor = colors.text.secondary
	}
}

//#endregion

//#region File System

function getAppDirectory() {
	// TODO: check if icloud is in use
	const useICloud = FileManager.local().isFileStoredIniCloud(module.filename)
	const fileManager = useICloud ? FileManager.iCloud() : FileManager.local()
	const appFolderName = 'untis'
	const appDirectory = fileManager.joinPath(fileManager.documentsDirectory(), appFolderName)

	if (!fileManager.fileExists(appDirectory)) {
		console.log('Created app folder.')
		fileManager.createDirectory(appDirectory, true)
	}

	return { appDirectory, useICloud }
}

async function readConfig(appDirectory: string, useICloud: boolean) {
	const fileManager = useICloud ? FileManager.iCloud() : FileManager.local()
	const configFileName = 'config.json'
	const configPath = fileManager.joinPath(appDirectory, configFileName)
	if (useICloud) {
		await fileManager.downloadFileFromiCloud(configPath)
	}
	const fileConfig: Config = JSON.parse(fileManager.readString(configPath))

	if (!fileManager.fileExists(configPath)) {
		console.log('Created config file with default config.')
		fileManager.writeString(configPath, JSON.stringify(defaultConfig))
	}

	// combine the defaultConfig and read config and write it to config
	return { ...defaultConfig, ...fileConfig }
}

//#endregion

//#region Flow Layout

class FlowLayoutRow {
	private currentRowWidth = 0
	private currentRowHeight = 0
	private previousTotalHeight = 0
	private currentRow: WidgetStack

	constructor(
		public readonly maxWidth: number,
		public readonly maxHeight: number,
		public readonly spacing: number,
		public readonly padding: number,
		public readonly container: WidgetStack
	) {
		this.container.layoutVertically()
		if (padding > 0) {
			this.container.setPadding(padding, padding, padding, padding)
		}
		this.currentRow = this.container.addStack()
		this.currentRow.layoutHorizontally()
		this.currentRow.spacing = spacing
		this.maxWidth -= padding * 2
		this.maxHeight -= padding * 2
	}

	private addRow() {
		if (this.previousTotalHeight > this.maxHeight) {
			console.warn('FlowLayoutRow: Cannot add row, max height reached')
			return
		}
		if (this.currentRowHeight !== 0) {
			this.previousTotalHeight += this.currentRowHeight + this.spacing
		}
		this.currentRow = this.container.addStack()
		this.currentRow.layoutHorizontally()
		this.currentRow.spacing = this.spacing
		this.currentRowWidth = 0
		this.currentRowHeight = 0
	}

	private checkCreateRow(componentWidth: number, componentHeight: number) {
		let spacing = this.currentRowWidth === 0 ? 0 : this.spacing
		const theoreticalWidth = this.currentRowWidth + componentWidth + spacing

		// add a new row if the width is not enough
		if (this.currentRowWidth !== 0 && theoreticalWidth > this.maxWidth) {
			console.log(
				`FlowLayoutRow: New row, component: ${componentWidth}, remaining: ${this.maxWidth - this.currentRowWidth}`
			)

			this.addRow()
		}

		// check if the height would overflow
		if (componentHeight > this.currentRowHeight) {
			if (this.previousTotalHeight + this.currentRowHeight > this.maxHeight) {
				console.warn(
					`FlowLayoutRow: Cannot add component, max height reached. (${
						this.previousTotalHeight + this.currentRowHeight
					})`
				)
				return false
			}
			// update the current row height
			this.currentRowHeight = componentHeight
		}

		this.currentRowWidth += componentWidth + spacing

		return true
	}

	public addText(text: string, font: Font, fontSize: number, color: Color) {
		const width = getTextWidth(text, fontSize)
		if (!this.checkCreateRow(width, getCharHeight(fontSize))) {
			return false
		}
		const textElement = this.currentRow.addText(text)
		textElement.font = font
		textElement.textColor = color
		textElement.lineLimit = 1
		return true
	}

	public addIcon(icon: string, size: number, color: Color) {
		if (!this.checkCreateRow(size * 1.1, size * 1.1)) {
			return false
		}
		addSymbol(icon, this.currentRow, { size, color })
		return true
	}

	public addContainer(width: number, height: number, flexibleSize?: boolean) {
		if (!this.checkCreateRow(width, height)) {
			return
		}
		const container = this.currentRow.addStack()
		if (!flexibleSize) {
			container.size = new Size(width, height)
		}
		return container
	}

	public finish() {
		const totalWidth = this.maxWidth + this.padding * 2
		const totalHeight = this.previousTotalHeight + this.currentRowHeight + this.padding * 2
		this.container.size = new Size(totalWidth, totalHeight)

		console.log(`FlowLayoutRow: Finished with size ${totalWidth}x${totalHeight}, ${this.maxHeight - totalHeight} remaining`)

		return {
			resultingWidth: this.maxWidth * 2 * this.padding,
			resultingHeight: totalHeight,
		}
	}
}

//#endregion

//#region Widget Size

interface HomescreenWidgetSizes {
	small: Size
	medium: Size
	large: Size
	extraLarge?: Size
}

type WidgetSizesList = Map<string, HomescreenWidgetSizes>

function getWidgetSizes() {
	const phoneSizes: WidgetSizesList = new Map([
		['428x926', { small: new Size(170, 170), medium: new Size(364, 170), large: new Size(364, 382) }],
		['414x896', { small: new Size(169, 169), medium: new Size(360, 169), large: new Size(360, 379) }],
		['414x736', { small: new Size(159, 159), medium: new Size(348, 157), large: new Size(348, 357) }],
		['390x844', { small: new Size(158, 158), medium: new Size(338, 158), large: new Size(338, 354) }],
		['375x812', { small: new Size(155, 155), medium: new Size(329, 155), large: new Size(329, 345) }],
		['375x667', { small: new Size(148, 148), medium: new Size(321, 148), large: new Size(321, 324) }],
		['360x780', { small: new Size(155, 155), medium: new Size(329, 155), large: new Size(329, 345) }],
		['320x568', { small: new Size(141, 141), medium: new Size(292, 141), large: new Size(292, 311) }],
	])

	const padSizes: WidgetSizesList = new Map([
		[
			'768x1024',
			{
				small: new Size(141, 141),
				medium: new Size(305.5, 141),
				large: new Size(305.5, 305.5),
				extraLarge: new Size(634.5, 305.5),
			},
		],
		[
			'744x1133',
			{
				small: new Size(141, 141),
				medium: new Size(305.5, 141),
				large: new Size(305.5, 305.5),
				extraLarge: new Size(634.5, 305.5),
			},
		],
		[
			'810x1080',
			{
				small: new Size(146, 146),
				medium: new Size(320.5, 146),
				large: new Size(320.5, 320.5),
				extraLarge: new Size(669, 320.5),
			},
		],
		[
			'820x1180',
			{
				small: new Size(155, 155),
				medium: new Size(342, 155),
				large: new Size(342, 342),
				extraLarge: new Size(715.5, 342),
			},
		],
		[
			'834x1112',
			{
				small: new Size(150, 150),
				medium: new Size(327.5, 150),
				large: new Size(327.5, 327.5),
				extraLarge: new Size(682, 327.5),
			},
		],
		[
			'834x1194',
			{
				small: new Size(155, 155),
				medium: new Size(342, 155),
				large: new Size(342, 342),
				extraLarge: new Size(715.5, 342),
			},
		],
		[
			'954x1373',
			{
				small: new Size(162, 162),
				medium: new Size(350, 162),
				large: new Size(350, 350),
				extraLarge: new Size(726, 350),
			},
		],
		[
			'970x1389',
			{
				small: new Size(162, 162),
				medium: new Size(350, 162),
				large: new Size(350, 350),
				extraLarge: new Size(726, 350),
			},
		],
		[
			'1024x1366',
			{
				small: new Size(170, 170),
				medium: new Size(378.5, 170),
				large: new Size(378.5, 378.5),
				extraLarge: new Size(795, 378.5),
			},
		],
		[
			'1192x1590',
			{
				small: new Size(188, 188),
				medium: new Size(412, 188),
				large: new Size(412, 412),
				extraLarge: new Size(860, 412),
			},
		],
	])

	const deviceSize = Device.screenSize()
	const deviceSizeString = `${deviceSize.width}x${deviceSize.height}`
	const alternativeDeviceSizeString = `${deviceSize.height}x${deviceSize.width}`
	console.log(`Device size: ${deviceSizeString}`)

	const isPad = Device.isPad()
	console.log(`Device isPad: ${isPad}`)

	if (isPad) {
		const size = padSizes.get(deviceSizeString) ?? padSizes.get(alternativeDeviceSizeString)
		if (size) {
			console.log(`Widget sizes for pad with size ${deviceSize}: ${JSON.stringify(size)}`)
			return size
		}
	} else {
		const size = phoneSizes.get(deviceSizeString) ?? phoneSizes.get(alternativeDeviceSizeString)
		if (size) {
			console.log(`Widget sizes for phone with size ${deviceSize}: ${JSON.stringify(size)}`)
			return size
		}
	}

	console.log(`Could not find widget sizes for device with size ${deviceSize}`)

	return {
		small: new Size(0, 0),
		medium: new Size(0, 0),
		large: new Size(0, 0),
		extraLarge: new Size(0, 0),
	}
}

function getWidgetSize(widgetSizes: HomescreenWidgetSizes, widgetFamily?: typeof config.widgetFamily): Size {
	// return a placeholder if the widget size is not defined
	if (widgetSizes === undefined) {
		return new Size(0, 0)
	}

	// return small widget size if the widget family is not set
	if (!widgetFamily) {
		console.log('Defaulting to large widget size')
		return widgetSizes['medium']
	}

	if (isHomescreenWidgetSize(widgetFamily, widgetSizes)) {
		return widgetSizes[widgetFamily] ?? new Size(0, 0)
	}

	return new Size(0, 0)
}

function isHomescreenWidgetSize(k: string, widgetSizes: HomescreenWidgetSizes): k is keyof typeof widgetSizes {
	return k in widgetSizes
}

//#endregion

//#region Widget Helpers

function applyCustomLessonConfig(lesson: TransformedLesson, config: Config) {
	lesson.backgroundColor = unparsedColors.background.primary

	// return default values if there is no custom config
	if (!lesson.subject || !config.lessonOptions[lesson.subject?.name]) {
		return
	}

	const customOption = config.lessonOptions[lesson.subject?.name]
	let unwrappedCustomOption: SingleLessonOption | undefined

	// unwrap the option, as there can be teacher specific options
	if (Array.isArray(customOption)) {
		unwrappedCustomOption = customOption.find((option) => {
			return lesson.teachers.some((teacher) => teacher.name === option.teacher)
		})
	} else {
		unwrappedCustomOption = customOption
	}

	if (!unwrappedCustomOption) {
		return
	}

	// apply the custom color
	if (unwrappedCustomOption.ignoreInfo?.includes(lesson.info ?? '')) lesson.info = ''
	if (unwrappedCustomOption.ignoreInfo?.includes(lesson.note ?? '')) lesson.note = ''
	if (unwrappedCustomOption.ignoreInfo?.includes(lesson.text ?? '')) lesson.text = ''
	if (unwrappedCustomOption.subjectOverride) lesson.subject.name = unwrappedCustomOption.subjectOverride
	if (unwrappedCustomOption.longNameOverride) lesson.subject.longName = unwrappedCustomOption.longNameOverride
	if (unwrappedCustomOption.color) lesson.backgroundColor = unwrappedCustomOption.color
}

function getRefreshDateForLessons(
	lessonsTodayRemaining: TransformedLesson[],
	lessonsTomorrow: TransformedLesson[],
	config: Config
) {
	let nextRefreshDate: Date

	// set the widget refresh time to the end of the current lesson, or the next lesson if there is only a short break
	if (lessonsTodayRemaining.length >= 1) {
		const firstLesson = lessonsTodayRemaining[0]
		const secondLesson = lessonsTodayRemaining[1]

		// if the next lesson has not started yet
		if (firstLesson.from > CURRENT_DATETIME) {
			nextRefreshDate = firstLesson.from
			console.log(`Would refresh at the start of the next lesson at ${nextRefreshDate}, as it has not started yet`)
		} else {
			// if the break is too short
			if (secondLesson && secondLesson.from.getTime() - firstLesson.to.getTime() < config.config.breakMax * 60 * 1000) {
				nextRefreshDate = secondLesson.from
				console.log(`Would refresh at the start of the next lesson at ${nextRefreshDate}, as the break is too short.`)
			} else {
				nextRefreshDate = firstLesson.to
				console.log(
					`Would refresh at the end of the current lesson at ${nextRefreshDate}, as there is a long enough break.`
				)
			}
		}
	} else {
		let shouldLazyUpdate = true

		// if the next lesson (on the next day) is in the scope of the frequent updates
		if (lessonsTomorrow && lessonsTomorrow.length > 1) {
			const timeUntilNextLesson = lessonsTomorrow[0].from.getTime() - CURRENT_DATETIME.getTime()
			shouldLazyUpdate = timeUntilNextLesson > config.config.refreshing.normalScope * 60 * 60 * 1000
		}

		// refresh based on normal/lazy refreshing
		if (shouldLazyUpdate) {
			console.log(`Would refresh in ${config.config.refreshing.lazyInterval} hours (lazy updating).`)
			nextRefreshDate = new Date(CURRENT_DATETIME.getTime() + config.config.refreshing.lazyInterval * 60 * 60 * 1000)
		} else {
			console.log(`Would refresh in ${config.config.refreshing.normalInterval} hours (normal updating).`)
			nextRefreshDate = new Date(CURRENT_DATETIME.getTime() + config.config.refreshing.normalInterval * 60 * 60 * 1000)
		}
	}

	return nextRefreshDate
}

/**
 * Compares two lessons and returns if they can be combined.
 * If ignoreDetails is true, only subject name and time will be compared.
 * @param ignoreDetails if the comparison should only consider subject and time
 */
function shouldCombineLessons(
	a: TransformedLesson,
	b: TransformedLesson,
	config: Config,
	ignoreDetails = false,
	ignoreBreaks = false
) {
	if (a.subject?.name !== b.subject?.name) return false
	if (!ignoreBreaks && b.from.getTime() - a.to.getTime() > config.config.breakMin * 60 * 1000) return false

	if (ignoreDetails) return true

	// check if the lessons are equal, ignoring the duration and time (as those are changed when combining)
	const ignoredEqualKeys = ['duration', 'to', 'from', 'id']
	const keyIgnorer = (key: string, value: any) => (ignoredEqualKeys.includes(key) ? undefined : value)
	return JSON.stringify(a, keyIgnorer) === JSON.stringify(b, keyIgnorer)
}

//#endregion

//#region Helpers

/**
 * Returns a title for a subject following an order based on what is available.
 */
function getSubjectTitle(lesson: TransformedLesson, useLongName = false) {
	if (useLongName && lesson.subject?.longName) return lesson.subject.longName
	if (lesson.subject?.name) return lesson.subject.name
	if (lesson.info && lesson.info.length > 0) return lesson.info
	if (lesson.text && lesson.text.length > 0) return lesson.text
	if (lesson.teachers.length > 0) return lesson.teachers[0].name
	return '?'
}

function sortKeysByDate(timetable: TransformedLessonWeek) {
	const keys = Object.keys(timetable)
	return keys.sort((a, b) => {
		return new Date(a).getTime() - new Date(b).getTime()
	})
}

function getCharHeight(size: number) {
	return size * 1.2
}

function getCharWidth(size: number) {
	return size * 0.75
}

function getTextWidth(text: string, fontSize: number) {
	const charWidth = getCharWidth(fontSize)
	// count the number of really narrow characters
	let reallyNarrowCharCount = text.match(/[\|I\.,:; ]/g)?.length ?? 0
	// count the number of narrow characters
	let narrowCharCount = text.match(/[1iljtr]/g)?.length ?? 0
	// count the number of wide characters
	let wideCharCount = text.match(/[wmWM]/g)?.length ?? 0

	let normalCharCount = text.length - reallyNarrowCharCount - narrowCharCount - wideCharCount

	// approximate the width of the text
	return charWidth * (normalCharCount + reallyNarrowCharCount * 0.5 + narrowCharCount * 0.75 + wideCharCount * 1.25)
}

function asMilliseconds(duration: number, unit: 'seconds' | 'minutes' | 'hours' | 'days') {
	switch (unit) {
		case 'seconds':
			return duration * 1000
		case 'minutes':
			return duration * 60 * 1000
		case 'hours':
			return duration * 60 * 60 * 1000
		case 'days':
			return duration * 24 * 60 * 60 * 1000
	}
}

function asMinutes(duration: number, unit: 'seconds' | 'minutes' | 'hours' | 'days') {
	return asMilliseconds(duration, unit) / 60_000
}

function scheduleNotification(
	title: string,
	body?: string,
	sound?: 'default' | 'accept' | 'alert' | 'complete' | 'event' | 'failure' | 'piano_error' | 'piano_success' | 'popup',
	date = new Date(Date.now() + 5000)
) {
	const notification = new Notification()

	notification.title = title
	notification.body = body
	notification.sound = sound ?? 'event'

	notification.threadIdentifier = 'untis'
	notification.deliveryDate = date

	notification.schedule()
}

//#endregion

//#endregion

//#region Layout

const viewNames = ['lessons', 'preview', 'exams', 'grades', 'absences', 'roles'] as const
type ViewName = typeof viewNames[number]

// the layout is a list of views separated by commas, the columns are separated by pipes
const defaultLayout = 'lessons,preview|exams,grades,absences'

function parseLayoutString(layoutString: string) {
	let layout: ViewName[][] = []
	for (const column of layoutString.split('|')) {
		let columnViews: ViewName[] = []
		for (const view of column.split(',')) {
			if (viewNames.includes(view as ViewName)) {
				columnViews.push(view as ViewName)
			} else {
				console.warn(`Invalid view name: ${view}`)
			}
		}
		layout.push(columnViews)
	}

	return layout
}

function adaptLayoutForSize(layout: ViewName[][]) {
	switch (config.widgetFamily) {
		case 'small':
			return layout.slice(0, 1)
		case 'medium':
		case 'large':
			return layout.slice(0, 2)
		default:
			return layout
	}
}

const layoutString = args.widgetParameter ?? defaultLayout
console.log(layoutString)
const layout = adaptLayoutForSize(parseLayoutString(layoutString))
console.log(layout)

//#endregion

//#region Errors

type IErrorCodes = {
	[Property in ErrorCodes]: IErrorCode
}
interface IErrorCode {
	title: string
	description?: string
	icon?: string
}

type ErrorCodes =
	| 'NO_INTERNET'
	| 'NO_COOKIES'
	| 'LOGIN_ERROR'
	| 'NO_TOKEN'
	| 'NO_USER'
	| 'NOT_FOUND'
	| 'INVALID_WEBUNTIS_URL'
	| 'INPUT_CANCELLED'
	| 'SELECTION_CANCELLED'

const ErrorCode: IErrorCodes = {
	NO_INTERNET: { title: 'The internet connection appears to be offline.', icon: 'wifi.exclamationmark' },
	NO_COOKIES: { title: 'Could not get cookies.', description: 'Please check your credentials!', icon: 'key' },
	LOGIN_ERROR: { title: 'Could not login.', description: 'Please check your credentials!', icon: 'lock.circle' },
	NO_TOKEN: { title: 'Could not get token.', description: 'Please check your credentials!', icon: 'key' },
	NO_USER: { title: 'Could not get user.', description: 'Please check your credentials!', icon: 'person.fill.questionmark' },
	NOT_FOUND: { title: 'Got 404 Error.', description: 'WebUntis seems to be offline...', icon: 'magnifyingglass' },
	INVALID_WEBUNTIS_URL: { title: 'Invalid WebUntis URL', description: 'Please check your WebUntis URL!', icon: 'link' },
	INPUT_CANCELLED: { title: 'Input cancelled', description: 'Please try again!', icon: 'xmark.octagon' },
	SELECTION_CANCELLED: { title: 'Selection cancelled', description: 'Please try again!', icon: 'xmark.octagon' },
}

const ScriptableErrors = {
	NO_INTERNET: 'The internet connection appears to be offline.',
}

interface ExtendedError extends Error {
	icon?: string
}

/**
 * Creates an error from the given code.
 * @param errorCode
 * @returns an Error to be thrown
 */
function createError(errorCode: IErrorCode) {
	const error = new Error() as ExtendedError
	error.name = errorCode.title
	if (errorCode.description) {
		error.message = errorCode.description
	}
	if (errorCode.icon) {
		error.icon = errorCode.icon
	}
	return error
}

function throwError(errorCode: IErrorCode) {
	throw createError(errorCode)
}

function createErrorWidget(title: string, description: string, icon?: string) {
	const widget = new ListWidget()
	widget.backgroundColor = Color.black()

	const content = widget.addStack()
	content.layoutVertically()
	content.centerAlignContent()

	if (icon) {
		addSymbol(icon, content, { color: colors.text.red, size: 40 })
		content.addSpacer(8)
	}

	const errorTitle = widget.addText(title)
	errorTitle.font = Font.mediumSystemFont(18)
	errorTitle.textColor = colors.text.red

	if (description !== '') {
		const errorDescription = widget.addText(description)
		errorDescription.font = Font.regularSystemFont(14)
		errorDescription.textColor = colors.text.red
	}

	return widget
}

//#endregion

//#region Setup

const keychainRequestStrings = {
	school: {
		title: 'WebUntis School & Server',
		description:
			'Please visit https://webuntis.com/ and select your school. Then paste the url you were redirected to here.',
		placeholder: 'https://server.webuntis.com/WebUntis/?school=schoolname',
	},
	username: {
		title: 'WebUntis Username',
		description: 'The username you use to login to WebUntis.',
		placeholder: 'username',
	},
	password: {
		title: 'WebUntis Password',
		description: 'The password you use to login to WebUntis. It will be stored in your keychain.',
		placeholder: 'password',
	},
}

type AvailableKeychainEntries = keyof typeof keychainRequestStrings | 'server'

const usernamePlaceholders: Record<string, string> = {
	litec: '401467',
}

async function readKeychain(requestMissing: boolean = false) {
	if (requestMissing) {
		const server = await getFromKeychain('server')
		const school = await getFromKeychain('school')
		const username = await getFromKeychain('username', usernamePlaceholders[school ?? ''] ?? '')
		const password = await getFromKeychain('password')

		return { server, school, username, password }
	} else {
		return {
			server: Keychain.get('webuntis-server'),
			school: Keychain.get('webuntis-school'),
			username: Keychain.get('webuntis-username'),
			password: Keychain.get('webuntis-password'),
		}
	}
}

async function writeKeychain() {
	const initialUser = await readKeychain(false)

	await requestKeychainEntry('school', initialUser.school)
	await requestKeychainEntry('username', initialUser.username ?? usernamePlaceholders[initialUser.school ?? ''] ?? '')
	await requestKeychainEntry('password')
}

async function getFromKeychain(key: AvailableKeychainEntries, defaultValue: string = '') {
	const keychainKey = `webuntis-${key}`
	if (Keychain.contains(keychainKey)) {
		return Keychain.get(keychainKey)
	} else {
		return requestKeychainEntry(key, defaultValue)
	}
}

async function requestKeychainEntry(key: AvailableKeychainEntries, defaultValue = '') {
	switch (key) {
		case 'school':
		case 'server':
			const webuntisUrl = await askForInput({ ...keychainRequestStrings['school'], defaultValue })
			// get the server and school from the input
			const regex = /https:\/\/(.+?)\.webuntis\.com\/WebUntis\/\?school=(\w+).*/
			const match = webuntisUrl.match(regex)
			if (match) {
				const [, server, school] = match
				Keychain.set('webuntis-server', server)
				Keychain.set('webuntis-school', school)
				return school
			}
			throw createError(ErrorCode.INVALID_WEBUNTIS_URL)
		case 'username':
		case 'password':
			const input = await askForInput({ ...keychainRequestStrings[key], defaultValue })
			Keychain.set(`webuntis-${key}`, input)
			return input
	}
}

async function askForInput(options: {
	title: string
	description: string
	placeholder: string
	defaultValue: string
	isSecure?: boolean
}): Promise<string> {
	let alert = new Alert()
	alert.title = options.title
	alert.message = options.description

	const textField = alert.addTextField(options.placeholder, options.defaultValue)
	textField.isSecure = options.isSecure ?? false

	alert.addAction('OK')
	alert.addCancelAction('Cancel')

	const responseIndex = await alert.presentAlert()

	if (responseIndex === 0) {
		return alert.textFieldValue(0)
	} else {
		throw createError(ErrorCode.INPUT_CANCELLED)
	}
}

async function selectOption(
	availableOptions: string[],
	options: {
		title?: string
		description?: string
	}
): Promise<string> {
	let alert = new Alert()

	alert.title = options.title ?? 'Select an Option'
	alert.message = options.description ?? 'Choose one of the following options:'

	for (let option of availableOptions) {
		alert.addAction(option)
	}

	alert.addCancelAction('Cancel')

	const responseIndex = await alert.presentSheet()

	if (responseIndex === -1) {
		throw createError(ErrorCode.SELECTION_CANCELLED)
	}

	return availableOptions[responseIndex]
}

//#endregion

//#region Widget

interface FetchedData {
	lessonsTodayRemaining?: TransformedLesson[]
	lessonsNextDay?: TransformedLesson[]
	nextDayKey?: string
	exams?: TransformedExam[]
	grades?: TransformedGrade[]
	absences?: TransformedAbsence[]
	classRoles?: TransformedClassRole[]
	refreshDate?: Date
}

function checkNewRefreshDate(newDate: Date, fetchedData: FetchedData) {
	if (!fetchedData.refreshDate || newDate < fetchedData.refreshDate) {
		fetchedData.refreshDate = newDate
		return
	}
}

type FetchableNames = 'timetable' | 'exams' | 'grades' | 'absences' | 'roles'

async function fetchDataForViews(viewNames: ViewName[], user: FullUser, options: Options) {
	const fetchedData: FetchedData = {}
	const itemsToFetch = new Set<FetchableNames>()

	for (const viewName of viewNames) {
		switch (viewName) {
			case 'lessons':
			case 'preview':
				itemsToFetch.add('timetable')
				break
			case 'exams':
				itemsToFetch.add('exams')
				break
			case 'grades':
				itemsToFetch.add('grades')
				break
			case 'absences':
				itemsToFetch.add('absences')
				break
			case 'roles':
				itemsToFetch.add('roles')
				break
		}
	}

	const fetchPromises: Promise<any>[] = []

	if (itemsToFetch.has('timetable')) {
		const promise = getTimetable(user, options).then(({ lessonsTodayRemaining, lessonsNextDay, nextDayKey }) => {
			fetchedData.lessonsTodayRemaining = lessonsTodayRemaining
			fetchedData.lessonsNextDay = lessonsNextDay
			fetchedData.nextDayKey = nextDayKey
			checkNewRefreshDate(getRefreshDateForLessons(lessonsTodayRemaining, lessonsNextDay, options), fetchedData)
		})
		fetchPromises.push(promise)
	}

	if (itemsToFetch.has('exams')) {
		const examsFrom = new Date(new Date().getTime() + options.views.exams.scopeDays * 24 * 60 * 60 * 1000)
		const promise = getExamsFor(user, examsFrom, CURRENT_DATETIME, options).then((exams) => {
			fetchedData.exams = exams
		})
		const refreshDate = new Date(Date.now() + (options.config.cache.exams * 60 * 60 * 1000) / 2)
		checkNewRefreshDate(refreshDate, fetchedData)
		fetchPromises.push(promise)
	}

	if (itemsToFetch.has('grades')) {
		const gradesFrom = new Date(new Date().getTime() - options.views.grades.scopeDays * 24 * 60 * 60 * 1000)
		const promise = getGradesFor(user, gradesFrom, CURRENT_DATETIME, options).then((grades) => {
			fetchedData.grades = grades
		})
		const refreshDate = new Date(Date.now() + (options.config.cache.grades * 60 * 60 * 1000) / 2)
		checkNewRefreshDate(refreshDate, fetchedData)
		fetchPromises.push(promise)
	}

	if (itemsToFetch.has('absences')) {
		const schoolYears = await getSchoolYears(user, options)
		// get the current school year
		const currentSchoolYear = schoolYears.find(
			(schoolYear) => schoolYear.from <= CURRENT_DATETIME && schoolYear.to >= CURRENT_DATETIME
		)
		const promise = getAbsencesFor(user, currentSchoolYear.from, CURRENT_DATETIME, options).then((absences) => {
			fetchedData.absences = absences
		})
		const refreshDate = new Date(Date.now() + (options.config.cache.absences * 60 * 60 * 1000) / 2)
		checkNewRefreshDate(refreshDate, fetchedData)
		fetchPromises.push(promise)
	}

	if (itemsToFetch.has('roles')) {
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

interface ViewBuildData {
	container: WidgetStack
	width: number
	height: number
}

async function createWidget(user: FullUser, layout: ViewName[][], options: Options) {
	const widget = new ListWidget()

	const widgetSizes = getWidgetSizes()

	const paddingHorizontal = Math.max(options.appearance.padding, 4)
	const paddingVertical = Math.max(options.appearance.padding, 6)

	const widgetSize = getWidgetSize(widgetSizes, config.widgetFamily)
	const contentSize = new Size(widgetSize.width - paddingHorizontal * 2, widgetSize.height - paddingVertical * 2)

	widget.setPadding(paddingHorizontal, paddingVertical, paddingHorizontal, paddingVertical)
	widget.backgroundColor = Color.black()

	const widgetContent = widget.addStack()
	widgetContent.layoutHorizontally()
	// widgetContent.layoutVertically()
	widgetContent.topAlignContent()
	widgetContent.spacing = options.appearance.spacing

	// make a list of the shown views
	const shownViews = new Set<ViewName>()
	for (const row of layout) {
		for (const view of row) {
			shownViews.add(view)
		}
	}

	// fetch the data for the shown views
	const fetchedData = await fetchDataForViews(Array.from(shownViews), user, options)

	if (fetchedData.refreshDate) {
		console.log(`Refresh date: ${fetchedData.refreshDate}`)
		widget.refreshAfterDate = fetchedData.refreshDate
	}

	// TODO: flexible layout when only one column
	const columnWidth = contentSize.width / layout.length

	// add all the columns with the views
	for (const column of layout) {
		// add the column
		const columnStack = widgetContent.addStack()
		columnStack.layoutVertically()
		columnStack.topAlignContent()
		columnStack.spacing = options.appearance.spacing

		// calculate the real available height
		const availableContentHeight = options.footer.show
			? contentSize.height - FOOTER_HEIGHT - options.appearance.spacing
			: contentSize.height

		columnStack.size = new Size(columnWidth, availableContentHeight)

		let remainingHeight = availableContentHeight

		for (const view of column) {
			if (remainingHeight <= 0) continue

			console.log(`Adding view ${view} with maximum height ${remainingHeight}`)

			const viewData: ViewBuildData = {
				container: columnStack,
				width: columnWidth,
				height: remainingHeight,
			}

			switch (view) {
				case 'lessons':
					if (!fetchedData.lessonsTodayRemaining || !fetchedData.lessonsNextDay || !fetchedData.nextDayKey) {
						console.warn(`Tried to add lessons view, but no lessons data was fetched`)
						continue
					}
					// show a preview if there are no lessons today anymore
					if (fetchedData.lessonsTodayRemaining.length > 0) {
						remainingHeight -= addViewLessons(
							fetchedData.lessonsTodayRemaining,
							options.views.lessons.maxCount,
							viewData,
							options
						)
					} else {
						remainingHeight -= addViewPreview(fetchedData.lessonsNextDay, fetchedData.nextDayKey, viewData, options)
					}
					break
				case 'preview':
					if (!fetchedData.lessonsNextDay || !fetchedData.nextDayKey) {
						console.warn(`Tried to add preview view, but no lessons data was fetched`)
						continue
					}
					// only show the day preview, if it is not already shown
					if (shownViews.has('lessons') && fetchedData.lessonsTodayRemaining?.length === 0) break

					remainingHeight -= addViewPreview(fetchedData.lessonsNextDay, fetchedData.nextDayKey, viewData, options)
					break
				case 'exams':
					if (!fetchedData.exams) {
						console.warn(`Tried to add exams view, but no exams data was fetched`)
						continue
					}
					remainingHeight -= addViewExams(fetchedData.exams, options.views.exams.maxCount, viewData, options)
					break
				case 'grades':
					if (!fetchedData.grades) {
						console.warn(`Tried to add grades view, but no grades data was fetched`)
						continue
					}
					remainingHeight -= addViewGrades(fetchedData.grades, options.views.grades.maxCount, viewData, options)
					break
				case 'absences':
					if (!fetchedData.absences) {
						console.warn(`Tried to add absences view, but no absences data was fetched`)
						continue
					}
					remainingHeight -= addViewAbsences(fetchedData.absences, options.views.absences.maxCount, viewData, options)
					break
			}

			if (remainingHeight > options.appearance.spacing) {
				remainingHeight -= options.appearance.spacing
			}
		}

		if (remainingHeight > 4) {
			// add spacer to fill the remaining space
			columnStack.addSpacer()
		}
	}

	if (options.footer.show) {
		addFooter(widget, contentSize.width)
	}

	return widget
}

function addFooter(container: WidgetStack | ListWidget, width: number) {
	const footerGroup = container.addStack()
	footerGroup.layoutHorizontally()
	footerGroup.spacing = 4
	footerGroup.bottomAlignContent()
	footerGroup.centerAlignContent()
	// avoid overflow when pushed to the bottom
	footerGroup.setPadding(4, 6, 4, 6)
	footerGroup.size = new Size(width, FOOTER_HEIGHT)

	addSymbol('arrow.clockwise', footerGroup, {
		color: usingOldCache ? colors.text.red : colors.text.secondary,
		size: 10,
		outerSize: 10,
	})

	// show the time of the last update (now) as HH:MM with leading zeros
	const updateDateTime = footerGroup.addText(
		`${new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}`
	)
	updateDateTime.textColor = usingOldCache ? colors.text.red : colors.text.secondary
	updateDateTime.font = Font.regularSystemFont(10)

	if (usingOldCache) {
		const updateInfo = footerGroup.addText(' (cache)')
		updateInfo.textColor = colors.text.red
		updateInfo.font = Font.regularSystemFont(10)
	}

	footerGroup.addSpacer()

	// TODO: make more exact
	const executionDuration = `${new Date().getTime() - scriptStartDatetime.getTime()}ms`
	const executionDurationText = footerGroup.addText(executionDuration)
	executionDurationText.textColor = colors.text.secondary
	executionDurationText.font = Font.regularSystemFont(10)
}

//#endregion

//#region Script

async function setupAndCreateWidget() {
	const { appDirectory, useICloud } = getAppDirectory()
	const untisConfig = await readConfig(appDirectory, useICloud)
	const options = { ...untisConfig, appDirectory, useICloud }
	const user = await prepareUser(options)
	const widget = await createWidget(user, layout, options)
	return widget
}

async function runInteractive() {
	const actions = ['view', 'change']
	const input = await selectOption(actions, {
		title: 'What do you want to do?',
	})

	switch (input) {
		case 'view':
			const widget = await setupAndCreateWidget()
			widget.presentLarge()
			break
		case 'change':
			await writeKeychain()
			break
	}
}

async function run() {
	try {
		if (config.runsInWidget) {
			const widget = await setupAndCreateWidget()
			Script.setWidget(widget)
		} else {
			await runInteractive()
		}
	} catch (error) {
		let widget: ListWidget
		const castedError = error as Error

		if (castedError.message.toLowerCase() == ScriptableErrors.NO_INTERNET.toLowerCase()) {
			widget = createErrorWidget('The internet connection seems to be offline!', '', 'wifi.exclamationmark')
		} else {
			const extendedError = error as ExtendedError
			console.log(extendedError.stack)
			console.log(extendedError.cause as string)
			widget = createErrorWidget(extendedError.name, extendedError.message, extendedError.icon)
		}

		if (!config.runsInWidget) {
			widget.presentLarge()
		}

		Script.setWidget(widget)
	}
}

const scriptStartDatetime = new Date()

// the await is required, but top-level await cannot be used with module.exports
// @ts-ignore
await run()

console.log(`Script finished in ${new Date().getTime() - scriptStartDatetime.getTime()}ms.`)

Script.complete()

module.exports = {}
//#endregion
