// Handle errors and custom errors
module.exports.catchErrors = (error, request, response) => {
    if (typeof error === 'object') {
        console.error('ERROR [%s]:', request.raw.url, error.stack)
        response.send(error)
    } else {
        console.error('ERROR [%s]:', request.raw.url, error())
        const { code, message, statusCode } = error() // Custom error
        const newError = new Error(message)
        response.code(statusCode || code).send(newError)
    }
}

/**
 * Update error values without losing stack registers
 *
 * @param { Number } code - Status code
 * @param { String } message - Error message
 * @param { Object } error - Javascript error class instance
 * @return { Object } error - Updated error object
 */
module.exports.customError = (code, message, error) => {
    error.statusCode = code
    error.message = message

    return error
}