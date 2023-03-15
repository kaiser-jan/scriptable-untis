
export enum ElementType {
	GROUP = 1,
	TEACHER = 2,
	SUBJECT = 3,
	ROOM = 4,
}

export type Element = ElementGroup | ElementTeacher | ElementSubject | ElementRoom

/** An element as it comes from the api. */
export interface UnresolvedElement {
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

export enum LessonState {
	NORMAL = 'STANDARD',
	FREE = 'FREE',
	CANCELED = 'CANCEL',
	EXAM = 'EXAM',
	RESCHEDULED = 'SHIFT',
	SUBSTITUTED = 'SUBSTITUTION',
	ROOM_SUBSTITUTED = 'ROOMSUBSTITUTION',
	TEACHER_SUBSTITUTED = 'TEACHERSUBSTITUTION',
	ADDITIONAL = 'ADDITIONAL',
}

export enum ElementState {
	REGULAR = 'REGULAR',
	SUBSTITUTED = 'SUBSTITUTED',
	ABSENT = 'ABSENT',
}

export interface Lesson {
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

export interface Exam {
	examType: string
	name: string
	examDate: number
	startTime: number
	endTime: number
	subject: string
	teachers: string[]
	rooms: string[]
	text: string

	/**
	 * @deprecated the id is always 0
	 */
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

export interface Grade {
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

export interface Absence {
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

export interface ClassRole {
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

export interface SchoolYear {
	id: number
	name: string
	dateRange: {
		start: string
		end: string
	}
}
