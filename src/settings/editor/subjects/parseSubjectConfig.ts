import { SubjectConfig, TeacherSpecificSubjectConfig } from "@/types/config"
import { InputPreparedType, parseArray } from "@/utils/scriptable/input"
import { subjectConfigPlaceholderMap } from "./subjectsListEditor"

export function parseSubjectConfig(
	subjectConfig: InputPreparedType<SubjectConfig | TeacherSpecificSubjectConfig>,
	teacherSpecific = false
) {
	const parsedSubjectConfig: SubjectConfig | TeacherSpecificSubjectConfig = {}

	for (const key of Object.keys(subjectConfigPlaceholderMap)) {
		if (key === 'teacher' && !teacherSpecific) continue
		if (key === 'ignoreInfos') {
			log('ignoreInfos')
			parsedSubjectConfig[key] = parseArray(subjectConfig[key])
			continue
		}
		parsedSubjectConfig[key] = subjectConfig[key] ?? ''
	}

	return parsedSubjectConfig
}
