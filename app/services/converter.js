const fs = require('fs')
const axios = require('axios').default
//Missing ./constants import
const Constants = require('../constants')

const { promisify } = require('util')
const { exec } = require('child_process')
const runExec = promisify(exec)
const asyncMkDir = promisify(fs.mkdir)

/**
 * Apply standard model optimizations from gltf-transform
 * 
 * @typedef OptimizationResponse
 * @property {string} file - Absolute path of the new optimized file
 * @property {string} info - Optimization info
 * 
 * @param {string} glbFile Input file to be optimized
 * @returns {OptimizationResponse}
 */
module.exports.optimizeModel = async (glbFile) => {
    let inputGLB = `${glbFile}`
    if (!inputGLB.includes(Constants.DIR_TO_UPLOAD_FILES)) {
        inputGLB = `./${Constants.DIR_TO_UPLOAD_FILES}/${glbFile}`
    }

    const fileParts = inputGLB.substring(2).split('/')
    const outputGLB = `./${fileParts[0]}/${fileParts[1]}/optimized/${fileParts[2]}`

    const outputDir = `./${Constants.DIR_TO_UPLOAD_FILES}/${fileParts[1]}/optimized`
    await asyncMkDir(outputDir)

    // Optimization attempts to avoid infinite loop
    let attempts = 0

    const runOptimization = async (command) => {
        try {
            attempts++
            console.log(command)
            console.log('- In progress...')
            const res = await runExec(command, {timeout: 30 * 1000}) // timeout 30 seg ?
            console.log('gltf-transform response:', res.stdout && !res.stderr)

            if (attempts < 2 && res.stdout.search(/warn:.*may fail/)>0 || res.stderr) {
                console.log('Invalid Optimization KTX, try again without KTX...')
                await runExec(`rm ${outputGLB}`)
                const noKTX = `npx gltf-transform optimize ${inputGLB} ${outputGLB} --compress meshopt --instance false --texture-compress auto` // --verbose
                return await runOptimization(noKTX)
            } else {
                try {
                    const infoIndex = res.stdout.indexOf('info:')
                    const info = res.stdout.substring(infoIndex)
                    console.log('Optimization',info)
                    return {
                        file: outputGLB,
                        info
                    }
                } catch(ex) { /* ignore info errors! */ }
            }
        } catch(err) {
            console.error('KTX2 Error:', err.message)

            // In case of timeout, try again without ktx
            if (err.signal === 'SIGTERM' && attempts < 2) {
                console.log('Timeout optimization, try again without KTX...')
                const noKTX = `npx gltf-transform optimize "${inputGLB}" "${outputGLB}" --compress meshopt --instance false --texture-compress auto` // --verbose
                return await runOptimization(noKTX)
            } else {
                console.error(err)
            }
        }
    }

    const cmd = `npx gltf-transform optimize "${inputGLB}" "${outputGLB}" --compress meshopt --instance false --texture-compress ktx2` // --verbose
    return await runOptimization(cmd)
}