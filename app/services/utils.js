const fs = require('fs')
const Constants = require('../constants')


/**
 * Download the file received by the url param
 * @param {string} url 
 * @param {string} filename 
 * @returns {Promise<string>} Path of the downloaded file
 */
function downloadFile(url, filename, destinationFolder) {
	return new Promise((resolve) => {
		const https = require('https');
		
		let fileURL = url
		const sep = fileURL.includes('?') ? '&' : '?'
		if (!fileURL.includes(`${sep}v=`)) {
			fileURL = `${url}${sep}v=${Date.now()}`
		}
		// console.log('Download URL:', fileURL)
		https.get(fileURL, async (res) => {
			
			const code = res.statusCode ?? 0
			if (code >= 400) {
				// console.error('Existing File:', res.statusMessage)
				return resolve(false)
			}
			
			// handle redirects
			if (code > 300 && code < 400 && !!res.headers.location) {
				return resolve( downloadFile(url, filename, destinationFolder) )
			}
				
			// Model will be stored at this path
			let dest = destinationFolder
			if (!dest) {
				dest = await module.exports.createThreadFolder()
			}
			const path = `./${Constants.DIR_TO_UPLOAD_FILES}/${dest}/${filename}`
			const dir = `./${Constants.DIR_TO_UPLOAD_FILES}/${dest}/`

			if (!fs.existsSync(dir)) {
			  fs.mkdirSync(dir, { recursive: true })
			}
			
			const filePath = fs.createWriteStream(path)
			res.pipe(filePath);
			
			filePath.on('finish', () => {
				filePath.close()
				resolve(path)
			})
			
			filePath.on('error', (err) => {
				console.error('File not donwloaded', err)
				resolve(false)
			})
		})
	})
}
module.exports.downloadFile = downloadFile

/**
 * Delete temporal folder to handle uploaded files
 */
module.exports.deleteThreadFolder = async threadFolder => {
    const threadPath = `./${Constants.DIR_TO_UPLOAD_FILES}/${threadFolder}`

    return module.exports.deleteFolder(threadPath)
}
