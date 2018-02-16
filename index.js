'use strict'

const fs = require('fs')
const Hapi = require('hapi')
const Boom = require('boom')
const Inert = require('inert')
const Blankie = require('blankie')
const Scooter = require('scooter')
const AuthCookie = require('hapi-auth-cookie')
const { home, login, logout } = require('./service/routes')

const server = new Hapi.Server({
  host: '0.0.0.0',
  port: process.env.PORT || 3000,
})
const cache = server.cache({
  segment: 'sessions',
  expiresIn: 60 * 60 * 1000,
})

const init = async () => {
  await server.register(AuthCookie)
  await server.register(Inert)

  // CSP
  await server.register([
    Scooter,
    {
      plugin: Blankie,
      options: {
        imgSrc: ["'self'", 'https://dl.dropboxusercontent.com'],
        frameSrc: 'none',
      },
    },
  ])

  server.app.cache = cache

  server.auth.strategy('session', 'cookie', {
    password: 'password-should-be-32-characters',
    cookie: 'sid-dropbox',
    redirectTo: '/login',
    appendNext: true,
    isSecure: false,
    isSameSite: 'Lax',
    validateFunc: async (request, session) => {
      const cached = await cache.get(session.sid)
      const out = { valid: !!cached }

      if (out.valid) {
        out.credentials = cached.account
      }

      return out
    },
  })

  server.auth.default('session')

  server.route([
    {
      method: 'GET',
      path: '/favicon.ico',
      options: {
        auth: false,
        handler: (request, h) =>
          h
            .response(fs.createReadStream('./favicon.ico'))
            .code(200)
            .type('image/x-icon'),
      },
    },
    {
      method: 'GET',
      path: '/',
      options: {
        handler: home,
      },
    },
    {
      method: ['GET', 'POST'],
      path: '/login',
      options: {
        handler: login,
        auth: { mode: 'try' },
        plugins: { 'hapi-auth-cookie': { redirectTo: false } },
      },
    },
    {
      method: 'GET',
      path: '/logout',
      options: {
        handler: logout,
      },
    },
    {
      method: 'GET',
      path: '/oauthredirect',
      options: {
        handler: async (request, h) => h.redirect('/'),
      },
    },
    {
      method: ['GET', 'POST'],
      path: '/{any*}',
      handler: request => {
        const accept = request.raw.req.headers.accept

        if (accept && accept.match(/json/)) {
          // check header if there's a JSON request, not found
          return Boom.notFound()
        }

        return (
          '<html><head><title>Login page</title></head><body><h3>404' +
          '</h3><br/></body></html>'
        )
      },
    },
  ])

  await server.start()
  console.log(`Server running at: ${server.info.uri}`)
}

init().catch(err => {
  console.log(err)
  process.exit(1)
})
