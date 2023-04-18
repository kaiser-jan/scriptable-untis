import { LOCALE, NO_VALUE_PLACEHOLDERS } from '@/constants'
import { applySubjectConfig, getLessonConfigFor } from '@/settings/lessonConfig'
import { Settings } from '@/settings/settings'
import { LessonState } from '@/types/api'
import { TransformedAbsence, TransformedExam, TransformedGrade, TransformedLessonWeek } from '@/types/transformed'
import { asNumericTime, scheduleNotification } from '@/utils/helper'
import { getSubjectTitle } from '@/utils/lessonHelper'

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
	widgetConfig: Settings
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

			// apply the custom config (name, infos to ignore, etc.)
			applySubjectConfig(lesson, getLessonConfigFor(lesson, widgetConfig))
			applySubjectConfig(cachedLesson, getLessonConfigFor(cachedLesson, widgetConfig))

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
				if (lesson.from.getDate() === lesson.rescheduleInfo.otherTo.getDate()) {
					scheduleNotification(
						`⏫ ${dayString}: ${subjectTitle} was shifted`,
						`from ${asNumericTime(lesson.from)} to ${asNumericTime(lesson.rescheduleInfo.otherFrom)}`
					)
					continue
				}

				scheduleNotification(
					`⌚ ${dayString}: ${subjectTitle} was rescheduled`,
					`from ${lesson.from.toLocaleString(LOCALE, {
						weekday: 'short',
						timeStyle: 'short',
					})} to ${lesson.rescheduleInfo.otherFrom.toLocaleString(LOCALE, {
						weekday: 'short',
						timeStyle: 'short',
					})}`
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

export function compareCachedExams(exams: TransformedExam[], cachedExams: TransformedExam[], widgetConfig: Settings) {
	// find any exams that were added
	for (const exam of exams) {
		const cachedExam = cachedExams.find((cachedExam) => {
			return cachedExam.subject === exam.subject && cachedExam.type === exam.type && cachedExam.from === exam.from
		})

		if (!cachedExam) {
			scheduleNotification(
				`🎓 Exam ${exam.subject} on ${asNumericTime(exam.from)}`,
				`The ${exam.type} takes place @ ${asNumericTime(exam.from)} in ${
					exam.roomNames.join(', ') || 'an unknown room'
				}.`
			)
			continue
		}
	}
}

export function compareCachedGrades(
	grades: TransformedGrade[],
	cachedExams: TransformedGrade[],
	widgetConfig: Settings
) {
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

export function compareCachedAbsences(
	absences: TransformedAbsence[],
	cachedAbsences: TransformedAbsence[],
	widgetConfig: Settings
) {
	// find any absences that were added
	for (const absence of absences) {
		const cachedAbsence = cachedAbsences.find(
			(cachedAbsence) => JSON.stringify(cachedAbsence) === JSON.stringify(absence)
		)

		// TODO: notify for excused absences

		if (!cachedAbsence) {
			scheduleNotification(
				`🚷 Absence was added by ${absence.createdBy}`,
				`you were absent from ${absence.from.toLocaleString(LOCALE)} to ${absence.to.toLocaleString(LOCALE)}`
			)
			continue
		}
	}
}
