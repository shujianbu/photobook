'use strict'

const Hapi = require('hapi')
const Inert = require('inert')
const crypto = require('crypto')
const AuthCookie = require('hapi-auth-cookie')
const rp = require('request-promise')
const queryString = require('query-string')
const uuid = require('uuid/v1')
const config = require('./config')
const controller = require('./controller')

const server = new Hapi.Server({ host: 'localhost', port: 3000 })
const cache = server.cache({
  segment: 'sessions',
  expiresIn: 60 * 60 * 1000,
})

const home = async (request, h) => {
  const token = request.auth.credentials.access_token
  if (token) {
    try {
      const paths = await controller.getLinksAsync(token)
      console.log(paths)
      return (
        '<html><head><title>Login page</title></head><body><h3>Welcome ' +
        '!</h3><br/><form method="get" action="/logout">' +
        '<input type="submit" value="Logout">' +
        '</form></body></html>'
      )
    } catch (error) {
      return new Error('Error getting images from Dropbox')
    }
  } else {
    h.redirect('/login')
  }
}

const login = async (request, h) => {
  if (request.auth.isAuthenticated) {
    return h.redirect('/')
  }

  if (request.query.next && request.query.next !== '/') {
    const parsed = queryString.parse(request.query.next)
    const options = {
      url: config.DBX_API_DOMAIN + config.DBX_TOKEN_PATH,
      qs: {
        code: parsed.code,
        grant_type: 'authorization_code',
        client_id: config.DBX_APP_KEY,
        client_secret: config.DBX_APP_SECRET,
        redirect_uri: config.OAUTH_REDIRECT_URL,
      },
      method: 'POST',
      json: true,
    }

    try {
      const response = await rp(options)
      const sid = uuid()
      await request.server.app.cache.set(
        sid,
        { account: { access_token: response.access_token } },
        0,
      )
      request.cookieAuth.set({ sid })
      return h.redirect('/')
    } catch (err) {
      console.log('err') // TODO: error page
    }
  } else {
    const state = crypto.randomBytes(16).toString('hex')
    const dbxRedirect =
      config.DBX_OAUTH_DOMAIN +
      config.DBX_OAUTH_PATH +
      '?response_type=code&client_id=' +
      config.DBX_APP_KEY +
      '&redirect_uri=' +
      config.OAUTH_REDIRECT_URL +
      '&state=' +
      state
    return h.redirect(dbxRedirect)
  }
}

const logout = (request, h) => {
  request.server.app.cache.drop(request.state['sid-dropbox'].sid)
  request.cookieAuth.clear()
  return h.redirect('/')
}

const init = async () => {
  await server.register(AuthCookie)
  await server.register(Inert)
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
  ])

  await server.start()
  console.log(`Server running at: ${server.info.uri}`)
}

init().catch(err => {
  console.log(err)
  process.exit(1)
})
