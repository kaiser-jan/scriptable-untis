import { Settings } from '@/settings/settings'
import { Element, ElementState, ElementType, Lesson, LessonState, UnresolvedElement } from '@/types/api'
import {
	ExtendedTransformedElement,
	Group,
	Room,
	Stateful,
	StatefulElement,
	StatelessElement,
	Subject,
	Teacher,
	TransformedLesson,
	TransformedLessonWeek,
} from '@/types/transformed'
import { shouldCombineLessons } from '@/utils/lessonHelper'
import { combineDateAndTime } from './transform'
import { SubjectConfig } from '@/types/settings'

/**
 * Transforms the lessons from the API to a more usable format,
 * links them up with the elements, and sorts them by date.
 * Also tries to correct the state.
 * @param lessons the lessons to transform returned from the API
 * @param elements the elements to link to the lessons
 * @param widgetConfig the config to use for the transformation
 * @returns a transformed lesson week
 */

export function transformLessons(
	lessons: Lesson[],
	elements: Element[],
	widgetConfig: Settings
): TransformedLessonWeek {
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

		const unknownSubject: Stateful<ExtendedTransformedElement> = {
			id: -1,
			name: lesson.lessonText ?? '?',
			longName: lesson.lessonText ?? 'unknown',
			state: ElementState.REGULAR,
		}

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
			// TODO: a subject might have no subject, a project week for example
			subject: subject ?? unknownSubject,
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
		if (subject?.original) {
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

		// TODO: move this somewhere, where it would be expected
		// add a subject config if it does not exist yet
		if (widgetConfig.config.autoAddSubjects && subject?.name && !widgetConfig.subjects[subject.name]) {
			const subjectConfig: SubjectConfig = {
				color: undefined,
				nameOverride: subject.name,
				longNameOverride: subject.longName,
			}
			widgetConfig.subjects[subject.name] = subjectConfig
		}
	}

	console.log('Sorting...')

	// sort the lessons by start time
	for (const dateKey in transformedLessonWeek) {
		transformedLessonWeek[dateKey].sort((a, b) => a.from.getTime() - b.from.getTime())
	}

	let combinedLessonWeek: TransformedLessonWeek = {}
	// combine lessons which are equal and are directly after each other
	for (const dateKey in transformedLessonWeek) {
		combinedLessonWeek[dateKey] = combineLessons(transformedLessonWeek[dateKey], widgetConfig)
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

export function combineLessons(
	lessons: TransformedLesson[],
	widgetConfig: Settings,
	ignoreDetails = false,
	ignoreBreaks = false
) {
	const combinedLessonsNextDay: TransformedLesson[] = []
	for (const [index, lesson] of lessons.entries()) {
		const previousLesson = combinedLessonsNextDay[combinedLessonsNextDay.length - 1]

		if (
			index !== 0 &&
			previousLesson &&
			shouldCombineLessons(previousLesson, lesson, widgetConfig, ignoreDetails, ignoreBreaks)
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
