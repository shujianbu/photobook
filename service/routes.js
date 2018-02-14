const uuid = require('uuid/v1')
const crypto = require('crypto')
const rp = require('request-promise')
const queryString = require('query-string')

const config = require('./config')
const controller = require('./controller')

module.exports.home = async (request, h) => {
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

module.exports.login = async (request, h) => {
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

module.exports.logout = (request, h) => {
  request.server.app.cache.drop(request.state['sid-dropbox'].sid)
  request.cookieAuth.clear()
  return h.redirect('/')
}
