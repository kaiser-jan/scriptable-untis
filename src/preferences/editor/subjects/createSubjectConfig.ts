import { SubjectConfig, TeacherSpecificSubjectConfig } from '@/types/config'
import { Config } from '@/preferences/config'
import { InputOptions, InputPreparedType, askForInput, parseArray, showInfoPopup } from '@/utils/scriptable/input'
import { subjectConfigPlaceholderMap, addSubjectDescription } from './subjectsListEditor'
import { parseSubjectConfig } from './parseSubjectConfig'

export async function createNewSubjectConfig(config: Config, saveFullConfig: () => void) {
	console.log('Config Editor: Opening UI to add new subject.')

	// create a map of placeholders for the input
	const placeholderMap = {
		name: 'short subject name',
		...subjectConfigPlaceholderMap,
		teacher: 'teacher (optional)',
	}

	// create the input options
	let inputs: InputOptions<typeof placeholderMap>[] = []
	for (const key of Object.keys(placeholderMap)) {
		inputs.push({
			key: key as keyof typeof placeholderMap,
			placeholder: placeholderMap[key],
		})
	}

	// ask for the input
	const unparsedSubjectConfig = await askForInput({
		title: '➕ Add Subject',
		description: addSubjectDescription,
		inputs: inputs,
		doneLabel: 'Add',
	})

	log('done')

	if (!unparsedSubjectConfig) return

	log('1')

	if (!unparsedSubjectConfig.name) {
		showInfoPopup('Error', 'The subject name is required!')
		return
	}
	log('2')

	if (config.subjects[unparsedSubjectConfig.name]) {
		showInfoPopup('Error', 'A subject with this name already exists!')
		return
	}
	log('3')

	// avoid duplicate teacher configs
	if (
		unparsedSubjectConfig.teacher &&
		config.subjects[unparsedSubjectConfig.name] &&
		config.subjects[unparsedSubjectConfig.name].teachers &&
		config.subjects[unparsedSubjectConfig.name].teachers.find((t) => t.teacher === unparsedSubjectConfig.teacher)
	) {
		showInfoPopup('Error', 'This teacher already exists for this subject!')
		return
	}
	log('4')

	if ('teacher' in unparsedSubjectConfig && unparsedSubjectConfig.teacher) {
		log('teacher')

		// create the subject if it does not exist yet
		if (!config.subjects[unparsedSubjectConfig.name]) {
			console.log(
				`Config Editor: Creating new subject "${unparsedSubjectConfig.name}" for teacher "${unparsedSubjectConfig.teacher}".`
			)
			config.subjects[unparsedSubjectConfig.name] = {
				teachers: [],
			}
			log('done')
		}
		log('adding teacher')
		// add the teacher to the subject
		config.subjects[unparsedSubjectConfig.name].teachers.push(parseSubjectConfig(unparsedSubjectConfig, true) as TeacherSpecificSubjectConfig)

		console.log(`Config Editor: Added teacher "${unparsedSubjectConfig.teacher}" to subject "${unparsedSubjectConfig.name}".`)
		saveFullConfig()
		return
	}
	log('not')

	log(parseSubjectConfig(unparsedSubjectConfig))

	config.subjects[unparsedSubjectConfig.name] = parseSubjectConfig(unparsedSubjectConfig)

	saveFullConfig()

	console.log(`Config Editor: Added subject "${unparsedSubjectConfig.name}". ${JSON.stringify(unparsedSubjectConfig)}`)
}
