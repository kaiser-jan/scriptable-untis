import { SubjectConfig, TeacherSpecificSubjectConfig } from '@/types/config'
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

export function showSubjectListEditor(config: Config, saveFullConfig: () => void) {
	const table = new UITable()
	table.showSeparators = true

	updateSubjectListEditor(table, config, saveFullConfig)

	table.present()
}

/**
 * Opens a UITable with a list of the subjects and their configs.
 */
export function updateSubjectListEditor(table: UITable, config: Config, saveFullConfig: () => void) {
	table.removeAllRows()

	const headerRow = new UITableRow()
	headerRow.height = 60
	headerRow.isHeader = true

	const titleCell = headerRow.addText(configDescription.subjects._title)
	titleCell.titleFont = Font.semiboldSystemFont(28)
	titleCell.widthWeight = 70

	const addSubjectButton = headerRow.addButton('➕ add subject')
	addSubjectButton.widthWeight = 30
	addSubjectButton.rightAligned()
	addSubjectButton.onTap = () => {
		createNewSubjectConfig(config, () => applyChanges(table, config, saveFullConfig))
	}

	table.addRow(headerRow)

	// add a row for each subject
	for (const key of Object.keys(config.subjects)) {
		addSubjectConfigRow(
			table,
			key,
			config.subjects[key],
			() => {
				applyChanges(table, config, saveFullConfig)
			},
			() => {
				deleteSubject(table, config, key, saveFullConfig)
			}
		)
	}

	table.reload()
}

function applyChanges(table: UITable, config: Config, saveFullConfig: () => void) {
	console.log(`Config Editor: Saving changes to lesson config.`)
	saveFullConfig()
	updateSubjectListEditor(table, config, saveFullConfig)
}

function deleteSubject(table: UITable, config: Config, key: string, saveFullConfig: () => void) {
	console.log(`Config Editor: Deleting subject "${key}".`)
	delete config.subjects[key]
	applyChanges(table, config, saveFullConfig)
}

export function deleteTeacherSpecificSubject(
	subjectConfig: SubjectConfig,
	teacherConfig: TeacherSpecificSubjectConfig,
	key: string,
	saveFullConfig: () => void,
	deleteThisSubject: () => void
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
	else saveFullConfig()
}
