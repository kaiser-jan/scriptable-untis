import { LOCALE, NO_VALUE_PLACEHOLDERS } from "@/constants"
import { Config } from "@/preferences/config"
import { LessonState } from "@/types/api"
import { TransformedLessonWeek, TransformedExam, TransformedGrade, TransformedAbsence } from "@/types/transformed"
import { scheduleNotification, asNumericTime, asWeekday } from "@/utils/helper"
import { getSubjectTitle } from "@/utils/lessonHelper"

/**
 * Compares the fetched lessons with the cached lessons and sends notifications for most changes.
 * @param lessonWeek
 * @param cachedLessonWeek
 * @param widgetConfig
 * @returns
 */
export function compareCachedLessons(
	lessonWeek: TransformedLessonWeek,
	cachedLessonWeek: TransformedLessonWeek,
	widgetConfig: Config
) {
	console.log('Comparing cached lessons with fetched lessons.')

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
					scheduleNotification(`➕ ${subjectTitle} was added`, `${subjectTitle} was added on ${dayString}`)
				}
				continue
			}

			// check if the lesson has changed
			if (JSON.stringify(lesson) === JSON.stringify(cachedLesson)) {
				continue
			}

			if (lesson.info !== cachedLesson.info) {
				scheduleNotification(`ℹ️ Info for ${subjectTitle} changed`, `on ${dayString}: "${lesson.info}"`)
				continue
			}

			if (lesson.note !== cachedLesson.note) {
				scheduleNotification(`📝 Note for ${subjectTitle} changed`, `on ${dayString}: "${lesson.note}"`)
				continue
			}

			if (lesson.text !== cachedLesson.text) {
				scheduleNotification(`🔤 Text for ${subjectTitle} changed`, `on ${dayString}: "${lesson.text}"`)
				continue
			}

			if (lesson.isRescheduled !== cachedLesson.isRescheduled) {
				// only notify for the source
				if (!lesson.rescheduleInfo.isSource) continue

				// if the day is the same
				if (lesson.rescheduleInfo.otherFrom.getDate() === lesson.rescheduleInfo.otherTo.getDate()) {
					scheduleNotification(
						`⏫ ${dayString}: ${subjectTitle} was shifted`,
						`from ${asNumericTime(lesson.from)} to ${asNumericTime(lesson.rescheduleInfo.otherFrom)}`
					)
					continue
				}

				scheduleNotification(
					`⌚ ${dayString}: ${subjectTitle} was rescheduled`,
					`from ${asWeekday(lesson.rescheduleInfo.otherFrom)} to ${asWeekday(lesson.rescheduleInfo.otherTo)}`
				)
				continue
			}

			if (lesson.exam !== cachedLesson.exam) {
				if (lesson.exam) {
					scheduleNotification(
						`🎓 Exam for ${subjectTitle} was added`,
						`on ${dayString} at ${asNumericTime(lesson.from)}`
					)
					continue
				}
			}

			if (lesson.state !== cachedLesson.state) {
				const changedRooms = lesson.rooms.filter((room) => room.original)
				const changedTeachers = lesson.teachers.filter((teacher) => teacher.original)

				switch (lesson.state) {
					case LessonState.CANCELED:
					case LessonState.FREE:
						scheduleNotification(
							`❌ ${dayString}: ${subjectTitle} was cancelled`,
							`${subjectTitle} at ${asNumericTime(lesson.from)} was cancelled`
						)
						break
					case LessonState.ROOM_SUBSTITUTED:
						for (const room of changedRooms) {
							scheduleNotification(
								`🧭 ${dayString}: ${subjectTitle} - room changed`,
								`from ${room.original?.name} to ${room.name}`
							)
						}
						break
					case LessonState.TEACHER_SUBSTITUTED:
						for (const teacher of changedTeachers) {
							if (NO_VALUE_PLACEHOLDERS.includes(teacher.name)) {
								scheduleNotification(
									`🧑‍🏫 ${dayString}: ${subjectTitle} - teacher cancelled`,
									`teacher ${teacher.original?.name} cancelled`
								)
								return
							}

							scheduleNotification(
								`🧑‍🏫 ${dayString}: ${subjectTitle} - teacher substituted`,
								`from ${teacher.original.name} to ${teacher.name}`
							)
						}
						break
					case LessonState.SUBSTITUTED:
						scheduleNotification(
							`🔄 ${dayString}: ${subjectTitle} substituted`,
							`${getSubjectTitle(lesson)} at ${asNumericTime(lesson.from)} with ${lesson.teachers.join(
								', '
							)} in ${lesson.rooms.join(', ')}`
						)
						break
				}
				continue
			}
		}
	}
}

export function compareCachedExams(exams: TransformedExam[], cachedExams: TransformedExam[], widgetConfig: Config) {
	// find any exams that were added
	for (const exam of exams) {
		const cachedExam = cachedExams.find((cachedExam) => {
			return cachedExam.subject === exam.subject && cachedExam.type === exam.type && cachedExam.from === exam.from
		})

		if (!cachedExam) {
			scheduleNotification(
				`🎓 Exam ${exam.subject} on ${exam.from.toLocaleDateString(LOCALE)}`,
				`The ${exam.type} takes place @ ${exam.from.toLocaleTimeString(LOCALE)} in ${
					exam.roomNames.join(', ') || 'an unkonwn room'
				}.`
			)
			continue
		}
	}
}

export function compareCachedGrades(grades: TransformedGrade[], cachedExams: TransformedGrade[], widgetConfig: Config) {
	// find any grades that were added
	for (const grade of grades) {
		const cachedGrade = cachedExams.find((cachedGrade) => JSON.stringify(cachedGrade) === JSON.stringify(grade))

		if (!cachedGrade) {
			scheduleNotification(
				`💯 Received a grade in ${grade.subject}`,
				`you got a "${grade.mark.displayValue}" (${grade.text}) on a ${grade.examType.name}`
			)
			continue
		}
	}
}

export function compareCachedAbsences(absences: TransformedAbsence[], cachedAbsences: TransformedAbsence[], widgetConfig: Config) {
	// find any absences that were added
	for (const absence of absences) {
		const cachedAbsence = cachedAbsences.find(
			(cachedAbsence) => JSON.stringify(cachedAbsence) === JSON.stringify(absence)
		)

		if (!cachedAbsence) {
			scheduleNotification(
				`🚷 Absence was added by ${absence.createdBy}`,
				`you were absent from ${absence.from.toLocaleString(LOCALE)} to ${absence.to.toLocaleString(LOCALE)}`
			)
			continue
		}
	}
}
