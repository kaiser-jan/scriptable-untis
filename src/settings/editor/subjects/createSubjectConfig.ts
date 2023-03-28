import { Settings } from '@/settings/defaultConfig'
import { BackFunctionType, SaveFullConfigFunction, TeacherSpecificSubjectConfig } from '@/types/config'
import { InputOptions, askForInput, showInfoPopup } from '@/utils/scriptable/input'
import { parseSubjectConfig } from './parseSubjectConfig'
import { subjectConfigPlaceholderMap } from './subjectsListEditor'
import { editSubjectDescription } from './subjectConfigEditor'

export const addSubjectDescription = `${editSubjectDescription}
short name: subject name displayed in WebUntis.
teacher: short name of the teacher to apply this config to
`

export async function createNewSubjectConfig(config: Settings, saveFullConfig: SaveFullConfigFunction, backFunction: BackFunctionType) {
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

	if (!unparsedSubjectConfig) return

	if (!unparsedSubjectConfig.name) {
		showInfoPopup('Error', 'The subject name is required!')
		return
	}

	if (config.subjects[unparsedSubjectConfig.name]) {
		showInfoPopup('Error', 'A subject with this name already exists!')
		return
	}

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

	if ('teacher' in unparsedSubjectConfig && unparsedSubjectConfig.teacher) {
		// create the subject if it does not exist yet
		if (!config.subjects[unparsedSubjectConfig.name]) {
			console.log(
				`Config Editor: Creating new subject "${unparsedSubjectConfig.name}" for teacher "${unparsedSubjectConfig.teacher}".`
			)
			config.subjects[unparsedSubjectConfig.name] = {
				teachers: [],
			}
		}
		// add the teacher to the subject
		config.subjects[unparsedSubjectConfig.name].teachers.push(parseSubjectConfig(unparsedSubjectConfig, true) as TeacherSpecificSubjectConfig)

		console.log(`Config Editor: Added teacher "${unparsedSubjectConfig.teacher}" to subject "${unparsedSubjectConfig.name}".`)
		saveFullConfig(backFunction)
		return
	}

	config.subjects[unparsedSubjectConfig.name] = parseSubjectConfig(unparsedSubjectConfig)

	saveFullConfig(backFunction)

	console.log(`Config Editor: Added subject "${unparsedSubjectConfig.name}". ${JSON.stringify(unparsedSubjectConfig)}`)
}
