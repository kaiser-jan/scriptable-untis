export type GithubRelease = {
	url: string
	tag_name: string
	name: string
	body: string
	prerelease: boolean
	created_at: string
	published_at: string
	assets: GithubAsset[]
}

export type GithubAsset = {
	url: string
	browser_download_url: string
	name: string
	label: string
	size: number
	download_count: number
	created_at: string
	updated_at: string
}
