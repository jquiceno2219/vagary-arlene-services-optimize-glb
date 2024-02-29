const fs = require('fs'); //Done

const utils = require('../services/utils'); //Done
const converter = require('../services/converter'); //Done
const storage = require('../services/storage');
const firebase = require('../services/firebase');
/**  const Constants = require('../constants');
* Don't really know what this is useful for
* 
*
**/

/**
* Receive an string with a model URL, download it, optimize it and then upload it as the optimized version
* 
* POST /api/media/optimizeModel
* 
* @param {import('fastify').FastifyRequest} request
* @param {import('fastify').FastifyReply} response
*/
module.exports.optimizeModel = async (request, response) => {
	
	/** @type string */
	const glb = request.body?.glb ? request.body.glb.value : null
	
	if (!glb) {
		response.code(400).send("glb not defined")
		return
	}

	
	// Save this process on firebase
	const optimization = await firebase.createOptimizationChild(glb)
	if (optimization.data.status === 'optimized') {
		response.code(400).send("Model is already optimized")
		return
	}

	//const bucket = utils.getBucketFromURL(glb)
	let fullPath = glb.replace('https://', '')
	fullPath = fullPath.substring(fullPath.indexOf('/')).substring(1)
	
	const glbName = fullPath.split('/').pop()

	console.log(' ')

	// Checking if original model exists...
	const original = await utils.downloadFile(glb.replace(glbName, `original/${glbName}`), glbName)
	if (original) {
		optimization.data.status = 'optimized'
		optimization.save()
		response.code(400).send("Model is already optimized")
		return
	}

	console.log('Reading model', glb)
	// Get local copy of the model to optimize
	const downloaded = await utils.downloadFile(glb, glbName)
	if (!downloaded) {
		optimization.data.status = 'error'
		optimization.save()
		response.code(400).send("Model cannot be downloaded")
		return
	}
	// console.log('Downloaded:', downloaded)

	// Run model optimizations... can take up to 60 seconds
	const optimized = await converter.optimizeModel(downloaded)
	// console.log('Optimized:', optimized)

	const threadFullpath = downloaded.replace(`./uploads/`, '')
	const threadSlashIndex = threadFullpath.indexOf('/')
	const threadFolder = threadFullpath.substring(0, threadSlashIndex)
	
	if (optimized) {
		const projectPath = fullPath.replace(`/${glbName}`, '')
		
		// If the optimization was ok, we need to keep the copy of the original file
		// and then override the original model with the optimized model
		await storage.copySingleFile(
            //bucket,
            `${projectPath}/${glbName}`, `${projectPath}/original/${glbName}`) // Saves the original file
		await storage.uploadFile(
            //bucket, 
            projectPath, glbName, `${threadFolder}/optimized`, glbName) // Override existing file with optimized model

		const infoParts = optimized.info.split('→')
		infoParts[0] = infoParts[0].replace(glbName, 'Original').replace('info: ', '')
		infoParts[1] = infoParts[1].replace(glbName, 'Optimized')

		const stats = fs.statSync(optimized.file)

		optimization.data.status = 'optimized'
		optimization.data.info = infoParts.join('→')
		optimization.data.size = stats.size
		optimization.save()
		response.send(optimized.info)
	} else {
		optimization.data.status = 'error'
		optimization.save()
		response.code(400).send("Model cannot be optimized")
	}
	
	// Clean up local folders
	utils.deleteThreadFolder(threadFolder)
}
