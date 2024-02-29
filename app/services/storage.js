

/**
 * Copy single file from one folder to another
 * 
 * @param { String } bucket - Name of required bucket
 * @param { String } source - Source file to be copied
 * @param { String } destination - Target file
 */
module.exports.copySingleFile = (bucket, source, destination) => {
    // console.log('Copying file:', bucket, source, destination)
    return provider.copyFile(bucket, source, destination).catch(error => {
        if (error) {
            console.error('Copy error => ', error.message)
            throw createError('500', error)
        }
    })
}
