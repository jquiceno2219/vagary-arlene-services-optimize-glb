/*
== Don't know if i'll need this yet. Will just leave it commented for now. ==

const serverStatus = require('./services/serverStatus')
const cron = require('./cron')
*/

const path = require('path')
const fs = require('fs')
const os = require('os')

let https = null
let host = '0.0.0.0'
const VITE_SSL_DIR = path.join(os.homedir(), '.vite-plugin-mkcert')
if (fs.existsSync(VITE_SSL_DIR)) {
  const SSL_FILE_KEY = `${VITE_SSL_DIR}/webxr-key.pem`
  const SSL_FILE_CERT = `${VITE_SSL_DIR}/webxr-cert.pem`
  https = {
    key: fs.readFileSync(SSL_FILE_KEY),
    cert: fs.readFileSync(SSL_FILE_CERT)
  }
  host = 'localhost'
  console.log(`\x1b[33mInit with SSL: ${SSL_FILE_CERT}\x1b[0m`)
}

// Require the framework and instantiate it
const fastify = require('fastify')({
    logger: {
        level: 'error'
    },
    https,
    //bodyLimit: 50331648
    bodyLimit: 2147483648 // 2Gb to receive all files from 360
})

fastify.register(require('@fastify/cors'), { origin: '*' })
fastify.register(require('@fastify/multipart'), { attachFieldsToBody: true })
fastify.register(require('@fastify/swagger'), {
    routePrefix: '/documentation',
    exposeRoute: true,
    swagger: {
        info: {
            title: 'Arlene Media Optimize GLB service',
            description: 'Testing the API to editor projects manager',
            version: '1.0.0'
        }
    }
})

fastify.register(require('./routes/optimize-model'))


/*
== Same as stated on line 1. ==

// Setup Hooks for requests status control
serverStatus.setup(fastify)

// Cron jobs
cron.setupTasks()
*/

const start = async () => {
    try {
        const PORT = process.env.NODE_PORT || 3202
        const address = await fastify.listen({ host, port: PORT })
        console.log(`Fastify server started at ${address.replace('[::1]', 'localhost')}`)

    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()