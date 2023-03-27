import { TransformedExam, TransformedGrade, TransformedAbsence, TransformedClassRole, TransformedSchoolYear } from "@/types/transformed"
import { Absence, ClassRole, Exam, Grade, SchoolYear } from "@/types/api"

function parseDateNumber(date: number) {
	const dateStr = date.toString()
	const year = dateStr.slice(0, 4)
	const month = dateStr.slice(4, 6)
	const day = dateStr.slice(6, 8)
	return new Date(`${year}-${month}-${day}`)
}

/**
 * Adds the necessary leading 0s, and combines date and time to a new JS Date object
 * @param date the date as a number, e.g. 20220911
 * @param time the time as a number, e.g. 830
 */
export function combineDateAndTime(date: number, time: number) {
	const parsedDate = parseDateNumber(date)

	const timeStr = time.toString().padStart(4, '0')
	const hours = timeStr.slice(0, 2)
	const minutes = timeStr.slice(2, 4)
	parsedDate.setHours(parseInt(hours))
	parsedDate.setMinutes(parseInt(minutes))

	return parsedDate
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
