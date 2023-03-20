import { SubjectConfig, TeacherSpecificSubjectConfig } from "@/types/config"
import { InputPreparedType, parseArray } from "@/utils/scriptable/input"
import { subjectConfigPlaceholderMap } from "./subjectsListEditor"

export function parseSubjectConfig(
	subjectConfig: InputPreparedType<SubjectConfig | TeacherSpecificSubjectConfig>,
	teacherSpecific = false
) {
	log("parsing")
	const parsedSubjectConfig: SubjectConfig | TeacherSpecificSubjectConfig = {}
	log("iterating")
	for (const key of Object.keys(subjectConfigPlaceholderMap)) {
		log(key)
		log(subjectConfig[key])
		if (key === 'teacher' && !teacherSpecific) continue
		log('-1')
		if (key === 'ignoreInfos') {
			log('ignoreInfos')
			parsedSubjectConfig[key] = parseArray(subjectConfig[key])
			continue
		}
		log('normal')
		parsedSubjectConfig[key] = subjectConfig[key] ?? ''
	}

	return parsedSubjectConfig
}
