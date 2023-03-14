import { Config } from "@/preferences/config"
import { TransformedLessonWeek, TransformedLesson, StatefulElement, TransformedExam, TransformedGrade, TransformedAbsence, TransformedClassRole, TransformedSchoolYear, Group, Room, Stateful, Subject, Teacher, StatelessElement, ExtendedTransformedElement } from "@/types/transformed"
import { shouldCombineLessons } from "@/utils/lessonHelper"
import { Absence, ClassRole, Element, ElementType, Exam, Grade, Lesson, LessonState, SchoolYear, UnresolvedElement } from "@/types/api"

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

/**
 * Transforms the lessons from the API to a more usable format,
 * links them up with the elements, and sorts them by date.
 * Also tries to correct the state.
 * @param lessons the lessons to transform returned from the API
 * @param elements the elements to link to the lessons
 * @param config the config to use for the transformation
 * @returns a transformed lesson week
 */
export function transformLessons(lessons: Lesson[], elements: Element[], config: Config): TransformedLessonWeek {
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
			groups: groups,
			teachers: teachers,
			subject: subject,
			rooms: rooms,

			// TODO: add specific teacher substitution
			state: lesson.cellState,
			isEvent: lesson.is.event,
			isRescheduled: 'rescheduleInfo' in lesson,

			duration: 1, // incremented when combining lessons
		}

		const changedTeacherCount = transformedLesson.teachers.filter((teacher) => teacher.original).length
		const changedRoomCount = transformedLesson.rooms.filter((room) => room.original).length

		// set the state depending on what changed, ordered by importance
		if (changedTeacherCount >= 1) {
			transformedLesson.state = LessonState.TEACHER_SUBSTITUTED
		}
		if (changedRoomCount >= 1) {
			// set to substituted if the teacher is also substituted
			if (changedTeacherCount) {
				transformedLesson.state = LessonState.SUBSTITUTED
			}
			transformedLesson.state = LessonState.ROOM_SUBSTITUTED
		}
		if (subject.original) {
			transformedLesson.state = LessonState.SUBSTITUTED
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

/**
 * Searches for the stateless element with the given id and type in the list of elements.
 * Stateless means that it cannot be substituted. (e.g. the substitution of an element
 * @param id
 * @param type the type as a number, one of the ElementType enum values
 * @param availableElements	the list of elements to search in, given by the API
 * @returns	the found element, or undefined if it was not found
 */
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

/**
 * Resolves the given unresolved element to a stateful element.
 * @param unresolvedElement the element to resolve, given by the API
 * @param availableElements	the list of elements to search in, given by the API
 * @returns	the resolved element
 */
function resolveStatefulElement(unresolvedElement: UnresolvedElement, availableElements: Element[]) {
	const statelessElement = resolveStatelessElement(unresolvedElement.id, unresolvedElement.type, availableElements)

	const element = statelessElement as StatefulElement
	element.state = unresolvedElement.state

	if (unresolvedElement.orgId && unresolvedElement.orgId !== 0) {
		const originalElement = resolveStatelessElement(
			unresolvedElement.orgId,
			unresolvedElement.type,
			availableElements
		)
		element.original = originalElement
	}

	return element
}

/**
 * Resolves the elements of the given lesson.
 * @param lesson the lesson to resolve the elements for
 * @param elements the list of elements to search in, given by the API
 * @returns the resolved elements (groups, teachers, subject, rooms)
 */
function resolveElements(lesson: Lesson, elements: Element[]) {
	const groups: Stateful<Group>[] = []
	const teachers: Stateful<Teacher>[] = []
	let subject: Stateful<Subject> | undefined
	const rooms: Stateful<Room>[] = []

	for (const unresolvedElement of lesson.elements) {
		const element = resolveStatefulElement(unresolvedElement, elements)

		if (!element) {
			console.warn(`Could not find element ${unresolvedElement.id} with type ${unresolvedElement.type}`)
			continue
		}

		switch (unresolvedElement.type) {
			case ElementType.TEACHER:
				teachers.push(element as Stateful<Teacher>)
				break
			case ElementType.GROUP:
				groups.push(element as Stateful<Group>)
				break
			case ElementType.SUBJECT:
				subject = element as Stateful<Subject>
				break
			case ElementType.ROOM:
				rooms.push(element as Stateful<Room>)
				break
			default:
				console.warn(`Unknown element type ${unresolvedElement.type}`)
				break
		}
	}

	return { groups, teachers, subject, rooms }
}

/**
 * Combines lessons which are directly after each other and have the same properties.
 * @param lessons
 * @param ignoreDetails if true, only the subject and time will be considered
 */
export function combineLessons(lessons: TransformedLesson[], config: Config, ignoreDetails = false, ignoreBreaks = false) {
	const combinedLessonsNextDay: TransformedLesson[] = []
	for (const [index, lesson] of lessons.entries()) {
		const previousLesson = combinedLessonsNextDay[combinedLessonsNextDay.length - 1]

		if (
			index !== 0 &&
			previousLesson &&
			shouldCombineLessons(previousLesson, lesson, config, ignoreDetails, ignoreBreaks)
		) {
			// update the break duration
			if (!previousLesson.break) previousLesson.break = 0
			previousLesson.break += lesson.from.getTime() - previousLesson.to.getTime()

			previousLesson.to = lesson.to
			previousLesson.duration++
		} else {
			combinedLessonsNextDay.push(lesson)
		}
	}
	return combinedLessonsNextDay
}

export function transformExams(exams: Exam[]) {
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

export function transformGrades(grades: Grade[]) {
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

export function transformAbsences(absences: Absence[]) {
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

export function transformClassRoles(classRoles: ClassRole[]) {
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

export function transformSchoolYears(schoolYears: SchoolYear[]) {
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
