export function* logArgs(logObj: any) {
	// logObj is like an array except it doesn't have a length to make it ArrayLike enough to use Array.from, and may have other stuff mixed in
	const numberedKeys = Object.keys(logObj)
		.map((key) => parseInt(key, 10))
		.filter((key) => !Number.isNaN(key))
		.sort()
	for (const key of numberedKeys) {
		yield logObj[key.toString()]
	}
}
