import { BackFunctionType, SaveFullConfigFunction, SubjectConfig, TeacherSpecificSubjectConfig } from '@/types/config'
import { Config } from '../../config'
import { configDescription } from '../configDescription'
import { createNewSubjectConfig } from './createSubjectConfig'
import { addSubjectConfigRow } from './subjectConfigRow'

export const subjectConfigPlaceholderMap: Record<keyof TeacherSpecificSubjectConfig, string> = {
	color: 'color (#123abc or name)',
	nameOverride: 'custom short name',
	longNameOverride: 'custom long Name',
	ignoreInfos: 'ignore ("info1", "info2")',
	teacher: 'teacher short name',
}

export function showSubjectListEditor(table: UITable, config: Config, saveFullConfig: SaveFullConfigFunction, backFunction: BackFunctionType) {
	table.removeAllRows()

	updateSubjectListEditor(table, config, saveFullConfig, backFunction)

	table.reload()
}

/**
 * Opens a UITable with a list of the subjects and their configs.
 */
export function updateSubjectListEditor(table: UITable, config: Config, saveFullConfig: SaveFullConfigFunction, backFunction: BackFunctionType) {
	table.removeAllRows()

	const headerRow = new UITableRow()
	headerRow.height = 60
	headerRow.isHeader = true

	let remainingHeaderWidth = 100

	// add a back button if this is not the top level
	if (backFunction) {
		const backButton = headerRow.addButton('⬅️')
		backButton.onTap = backFunction
		backButton.widthWeight = 15
		remainingHeaderWidth -= backButton.widthWeight
	}

	const titleCell = headerRow.addText(configDescription.subjects._title)
	titleCell.titleFont = Font.semiboldSystemFont(28)
	titleCell.widthWeight = 55
	remainingHeaderWidth -= titleCell.widthWeight

	const addSubjectButton = headerRow.addButton('➕ add subject')
	addSubjectButton.widthWeight = 30
	addSubjectButton.rightAligned()
	addSubjectButton.onTap = () => {
		createNewSubjectConfig(config, applyChanges, backFunction)
	}

	table.addRow(headerRow)

	function applyChanges() {
		console.log(`Config Editor: Saving changes to lesson config.`)
		saveFullConfig(backFunction)
		updateSubjectListEditor(table, config, saveFullConfig, backFunction)
	}

	function deleteSubject(key: string) {
		console.log(`Config Editor: Deleting subject "${key}".`)
		delete config.subjects[key]
		applyChanges()
	}

	// add a row for each subject
	for (const key of Object.keys(config.subjects)) {
		addSubjectConfigRow(
			table,
			key,
			config.subjects[key],
			applyChanges,
			() => deleteSubject(key),
			backFunction
		)
	}

	table.reload()
}

export function deleteTeacherSpecificSubject(
	subjectConfig: SubjectConfig,
	teacherConfig: TeacherSpecificSubjectConfig,
	key: string,
	saveFullConfig: SaveFullConfigFunction,
	deleteThisSubject: () => void,
	backFunction: BackFunctionType
) {
	// find the index by checking the teacher name
	const index = subjectConfig.teachers.findIndex((teacherConfig) => teacherConfig.teacher === teacherConfig.teacher)
	subjectConfig.teachers.splice(index, 1)
	console.log(`Config Editor: Deleted teacher "${teacherConfig.teacher}" from subject "${key}".`)

	// delete the subject if there are no more teachers
	if (subjectConfig.teachers.length === 0) delete subjectConfig.teachers

	// delete the subject if there are no more options
	if (Object.keys(subjectConfig).length === 0) deleteThisSubject()
	// only save if the subject was not deleted, as this already saves
	else saveFullConfig(backFunction)
}
