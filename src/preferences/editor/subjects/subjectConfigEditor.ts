import { BackFunctionType, SaveFullConfigFunction, SubjectConfig, TeacherSpecificSubjectConfig } from '@/types/config'
import { InputOptions, InputPreparedType, askForInput, showInfoPopup, stringifyArray } from '@/utils/scriptable/input'
import { subjectConfigPlaceholderMap } from './subjectsListEditor'
import { parseSubjectConfig } from './parseSubjectConfig'

export const editSubjectDescription = `Enter the config for the subject below.
ignore infos: lesson info to ignore`

export async function openSubjectConfigEditor(
	key: string,
	saveFullConfig: SaveFullConfigFunction,
	backFunction: BackFunctionType,
	currentConfig?: SubjectConfig | TeacherSpecificSubjectConfig
) {
	log(`Config Editor: Opening subject editor for subject "${key}".`)

	// prepare the current config for the input ui
	let inputPreparedConfig: InputPreparedType<typeof currentConfig> = {
		...currentConfig,
		ignoreInfos: currentConfig.ignoreInfos ? stringifyArray(currentConfig.ignoreInfos) : '',
		// remove the teachers property, as it cannot be edited here
		teachers: undefined,
	}

	let inputOptions: InputOptions<typeof inputPreparedConfig>[] = []

	// create the input options for the subject config
	for (const key of Object.keys(subjectConfigPlaceholderMap)) {
		// skip the teacher property if it is not set
		if (key === 'teacher' && !('teacher' in currentConfig)) continue

		inputOptions.push({
			key: key as keyof typeof currentConfig,
			placeholder: subjectConfigPlaceholderMap[key],
			defaultValue: inputPreparedConfig[key],
		})
	}

	// ask for the input
	const newUnparsedSubjectConfig = await askForInput<InputPreparedType<typeof currentConfig>>({
		title: `✏️ Edit Subject "${key}"`,
		description: editSubjectDescription,
		inputs: inputOptions,
		doneLabel: 'Save',
	})

	if (!newUnparsedSubjectConfig) return

	// show an error if the teacher is required but not set
	if ('teacher' in currentConfig && 'teacher' in newUnparsedSubjectConfig && !newUnparsedSubjectConfig.teacher) {
		showInfoPopup(
			'No teacher set!',
			'You need to set a teacher for this subject. If you want to delete this teacher specific subject, please use the delete button (❌).'
		)
	}

	// parse the input
	const newSubjectConfig = parseSubjectConfig(newUnparsedSubjectConfig)

	Object.assign(currentConfig, newSubjectConfig)

	saveFullConfig(backFunction)

	console.log(`Config Editor: Saved changes to subject "${key}". ${JSON.stringify(currentConfig)}`)
}
