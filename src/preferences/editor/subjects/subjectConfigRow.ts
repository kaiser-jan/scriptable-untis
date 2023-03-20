import { SubjectConfig, TeacherSpecificSubjectConfig } from '@/types/config';
import { stringifyArray } from '@/utils/scriptable/input';
import { openSubjectConfigEditor } from './subjectConfigEditor';
import { deleteTeacherSpecificSubject } from './subjectsListEditor';

export function addSubjectConfigRow(
	table: UITable,
	key: string,
	subjectConfig: SubjectConfig | TeacherSpecificSubjectConfig,
	saveFullConfig: () => void,
	deleteThisSubject: () => void) {
	const subjectOptionKeys = Object.keys(subjectConfig);

	// show the teacher specific configs
	if ('teachers' in subjectConfig && subjectConfig.teachers) {
		for (const teacherConfig of subjectConfig.teachers) {
			addSubjectConfigRow(table, key, teacherConfig, saveFullConfig, () => deleteTeacherSpecificSubject(subjectConfig, teacherConfig, key, saveFullConfig, deleteThisSubject)
			);
		}
		return;
	}

	// only show the subject if there is more than teacher specific configs
	if (subjectOptionKeys.length === 1 && subjectConfig[subjectOptionKeys[0]] === 'teachers')
		return;

	const subjectRow = new UITableRow();
	subjectRow.height = 60;
	subjectRow.dismissOnSelect = false;

	let rowTitle = key;
	if ('teacher' in subjectConfig && subjectConfig.teacher)
		rowTitle += ` with ${subjectConfig.teacher}`;
	if (subjectConfig.nameOverride)
		rowTitle += ` (${subjectConfig.nameOverride})`;

	let rowDescription = '';
	if (subjectConfig.longNameOverride)
		rowDescription += `"${subjectConfig.longNameOverride}"; `;
	if (subjectConfig.color)
		rowDescription += `color: "${subjectConfig.color}"; `;
	if (subjectConfig.ignoreInfos)
		rowDescription += `ignore infos: ${stringifyArray(subjectConfig.ignoreInfos)}; `;

	const subjectNameCell = subjectRow.addText(rowTitle, rowDescription);
	subjectNameCell.widthWeight = 80;
	subjectNameCell.subtitleColor = Color.gray();
	subjectNameCell.subtitleFont = Font.systemFont(12);
	subjectNameCell.titleFont = Font.mediumSystemFont(16);

	const editSubjectButton = subjectRow.addButton('✏️');
	editSubjectButton.widthWeight = 10;
	editSubjectButton.onTap = () => openSubjectConfigEditor(key, saveFullConfig, subjectConfig);

	// allow editing the subject when clicking anywhere on the row
	subjectRow.onSelect = () => openSubjectConfigEditor(key, saveFullConfig, subjectConfig);

	const deleteSubjectButton = subjectRow.addButton('❌');
	deleteSubjectButton.widthWeight = 10;
	// delete the subject or the teacher specific config
	deleteSubjectButton.onTap = deleteThisSubject;

	table.addRow(subjectRow);
}
