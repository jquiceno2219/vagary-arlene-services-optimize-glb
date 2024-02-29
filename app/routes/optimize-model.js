// I think its done(?)
//Check with julian.

const { catchErrors } = require('../controllers/errors')
const schemas = require('../schemas/converter')
const controller = require('../controllers/converter')

const route = 'optimizeModel';

const getPath = (routeName) => ({
    schema: schemas[routeName], 
    handler: controller[routeName],
    errorHandler: catchErrors
})

/**
 * Fastify plugin to encapsulates the routes for projects
 * Plugins guid at https://www.fastify.io/docs/latest/Guides/Plugins-Guide/
 *
 * @param { FastifyInstance } fastify - Encapsulated Fastify Instance
 * @param { Object } options - plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 * @param { Function } done -  It must be called when the plugin is ready
 */
module.exports =  async fastify => {
        fastify.post('/api/media/'+route, getPath(route))
    }