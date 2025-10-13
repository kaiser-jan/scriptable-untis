import { ElementState, LessonState } from './api'

/**
 * An element that does not have a state and can therefore not be substituted.
 */
export interface ExtendedTransformedElement {
	id: number
	name: string
	longName: string
}

export type Teacher = Omit<ExtendedTransformedElement, 'longName'>
export type Group = ExtendedTransformedElement
export type Subject = ExtendedTransformedElement
export interface Room extends ExtendedTransformedElement {
	capacity: number
}

export type StatelessElement = Teacher | Group | Subject | Room

/**
 * An element that has a state and can therefore be substituted.
 */
export type Stateful<T extends StatelessElement> = T & {
	state: ElementState
	original?: T
} & (
	T extends Teacher ? { longName: string } : {}
)
export type StatefulElement = Stateful<StatelessElement>

export interface TransformedLesson {
	id: number
	note?: string // lessonText
	text?: string // periodText
	info?: string // periodInfo
	substitutionText?: string

	from: Date // date + startTime
	to: Date // date + endTime

	groups: Stateful<Group>[]
	subject?: Stateful<Subject>
	teachers: Stateful<Teacher>[]
	rooms: Stateful<Room>[]

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

	break?: number
	duration: number
	backgroundColor?: string
}

export interface TransformedLessonWeek {
	[key: string]: TransformedLesson[]
}

/**
 * The id would always be 0.
 */
export interface TransformedExam {
	// id: number
	type: string
	name: string
	from: Date
	to: Date
	subject: string
	teacherNames: string[]
	roomNames: string[]
	// text: string
}

export interface TransformedGrade {
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

export interface TransformedAbsence {
	from: Date
	to: Date
	createdBy: string
	reason: string
	text: string
	reasonId: number
	isExcused: boolean
	excuseStatus: string
	excusedBy?: string
}

export interface TransformedHomework {
	id: number
	lessonId: number
	subject: string
	teacher: string
	text: string
	remark: string
	completed: boolean
	date?: Date
	dueDate?: Date
	attachments: any[]
}

export interface TransformedClassRole {
	fromDate: Date
	toDate: Date
	firstName: string
	lastName: string
	dutyName: string
}

export interface TransformedSchoolYear {
	id: number
	name: string
	from: Date
	to: Date
}
