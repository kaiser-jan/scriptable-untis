import { CONFIG_FILE_NAME } from '@/constants'
import { Config, defaultConfig } from '@/preferences/config'
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
		path: [fileManager.documentsDirectory(), CONFIG_FILE_NAME],
		fileManager: fileManager,
		create: true,
		defaultValue: JSON.stringify(defaultConfig)
	})

	const fileConfig: Config = JSON.parse(configJson)

	// combine the defaultConfig and read config and write it to config
	return deepMerge(defaultConfig, fileConfig) as Config
}

/**
 * Attempts to read a file from the file system. If create is false and the file does not exist, null is returned.
 * @param path the path starting with one of the scriptable directories (e.g. FileManager.documentsDirectory()) and ending with the file name
 * @param fileManager the file manager to use
 * @param create if true, the path and file will be created if they do not exist
 * @param defaultValue the default value to write to the file if it does not exist and create is true
 */
async function readFile(options: {
	path: string[]
	fileManager: FileManager
	create?: boolean
	defaultValue?: string
}) {
	const { path, fileManager, create = false, defaultValue = '' } = options

	// read and create directories up to the last one
	const rootPath = path[0]
	const directoryPath = path.slice(1, -1)
	const fileName = path[path.length - 1]

	let currentPath = rootPath
	for (const directory of directoryPath) {
		fileManager.joinPath(rootPath, directory)

		if (!fileManager.fileExists(currentPath)) {
			if (!create) return null
			fileManager.createDirectory(currentPath, true)
		}

		await fileManager.downloadFileFromiCloud(currentPath)
	}

	// read the file
	const filePath = fileManager.joinPath(currentPath, fileName)

	if (!fileManager.fileExists(filePath)) {
		if (!create) return null
		fileManager.writeString(filePath, defaultValue)
		return defaultValue
	}

	await fileManager.downloadFileFromiCloud(currentPath)
	return fileManager.readString(filePath)
}
