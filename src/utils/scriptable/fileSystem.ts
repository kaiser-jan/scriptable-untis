import { CONFIG_FILE_NAME } from '@/constants'
import { Settings, defaultSettings } from '@/settings/settings'
import { deepMerge } from '../helper'

export function getModuleFileManager() {
	const useICloud = FileManager.local().isFileStoredIniCloud(globalThis.module.filename)
	const fileManager = useICloud ? FileManager.iCloud() : FileManager.local()
	return { useICloud, fileManager }
}

/**
 * Reads the config from the file system and if it does not exist, creates it with the default config.
 */
export async function readConfig(useICloud: boolean) {
	const fileManager = useICloud ? FileManager.iCloud() : FileManager.local()

	const configJson = await readFile({
		baseDirectory: fileManager.documentsDirectory(),
		path: [CONFIG_FILE_NAME],
		fileManager: fileManager,
		create: true,
		defaultValue: JSON.stringify(defaultSettings),
	})

	const fileConfig: Settings = JSON.parse(configJson)

	// create a copy of the default config to avoid modifying it
	const defaultSettingsCopy = JSON.parse(JSON.stringify(defaultSettings))

	// combine the defaultSettings and read config and write it to config
	// TODO: omit "_" properties
	return deepMerge(defaultSettingsCopy, fileConfig) as Settings
}

export async function writeConfig(useICloud: boolean, config: Settings) {
	const fileManager = useICloud ? FileManager.iCloud() : FileManager.local()

	const path = fileManager.joinPath(fileManager.documentsDirectory(), CONFIG_FILE_NAME)

	fileManager.writeString(path, JSON.stringify(config))

	console.log('Config written to file system')
}

/**
 * Attempts to read a file from the file system. If create is false and the file does not exist, null is returned.
 * @param path the path starting with one of the scriptable directories (e.g. FileManager.documentsDirectory()) and ending with the file name
 * @param fileManager the file manager to use
 * @param create if true, the path and file will be created if they do not exist
 * @param defaultValue the default value to write to the file if it does not exist and create is true
 */
async function readFile(options: {
	baseDirectory: string
	path: string[]
	fileManager: FileManager
	create?: boolean
	defaultValue?: string
}) {
	const { path, fileManager, create = false, defaultValue = '' } = options

	// read and create directories up to the last one
	const directoryPaths = path.slice(1, -1)
	const fileName = path[path.length - 1]

	const directoryPath = await readFolder({
		baseDirectory: options.baseDirectory,
		directoryPath: directoryPaths,
		fileManager: fileManager,
		create: create,
	})

	// read the file
	const filePath = fileManager.joinPath(directoryPath, fileName)

	if (!fileManager.fileExists(filePath)) {
		if (!create) return null
		fileManager.writeString(filePath, defaultValue)
		return defaultValue
	}

	await fileManager.downloadFileFromiCloud(directoryPath)
	return fileManager.readString(filePath)
}

/**
 * Reads a path of directories and returns the path to the last directory.
 * @param baseDirectory the directory to start from
 * @param directoryPath the path to the directory
 * @param create if true, the directory path will be created if it does not exist
 * @returns the path to the last directory or null if the directory does not exist and create is false
 */
export async function readFolder(options: {
	fileManager: FileManager
	baseDirectory: string
	directoryPath: string[]
	create?: boolean
}) {
	const { fileManager, baseDirectory, directoryPath, create = false } = options

	let currentPath = baseDirectory
	for (const directory of directoryPath) {
		fileManager.joinPath(currentPath, directory)

		if (!fileManager.fileExists(currentPath)) {
			if (!create) return null
			fileManager.createDirectory(currentPath, true)
		}

		await fileManager.downloadFileFromiCloud(currentPath)
	}

	return currentPath
}
