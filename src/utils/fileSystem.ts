import { Config, deepMerge, defaultConfig } from "@/preferences/config"

export function getFileManagerOptions() {
	const useICloud = FileManager.local().isFileStoredIniCloud(globalThis.module.filename)
	const fileManager = useICloud ? FileManager.iCloud() : FileManager.local()

	const documentsDirectory = fileManager.documentsDirectory()

	// const appFolderName = 'untis'
	// const appDirectory = fileManager.joinPath(documentsDirectory, appFolderName)

	// if (!fileManager.fileExists(appDirectory)) {
	// 	console.log('Created app directory.')
	// 	fileManager.createDirectory(appDirectory, true)
	// }

	return { useICloud, documentsDirectory }
}

/**
 * Reads the config from the file system and if it does not exist, creates it with the default config.
 * @param documentsDirectory the scriptable documents directory
 * @param useICloud
 * @returns
 */
export async function readConfig(documentsDirectory: string, useICloud: boolean) {
	const fileManager = useICloud ? FileManager.iCloud() : FileManager.local()
	const configFileName = 'untis-config.json'
	const configPath = fileManager.joinPath(documentsDirectory, configFileName)

	if (!fileManager.fileExists(configPath)) {
		console.log('Created config file with default config.')
		fileManager.writeString(configPath, JSON.stringify(defaultConfig))
	}

	if (useICloud) {
		await fileManager.downloadFileFromiCloud(configPath)
	}

	const fileConfig: Config = JSON.parse(fileManager.readString(configPath))

	// combine the defaultConfig and read config and write it to config
	return deepMerge(defaultConfig, fileConfig)
}