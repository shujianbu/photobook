'use strict'
const config = require('dotenv').config()

module.exports = {
  DBX_API_DOMAIN: 'https://api.dropboxapi.com',
  DBX_OAUTH_DOMAIN: 'https://www.dropbox.com',
  DBX_OAUTH_PATH: '/oauth2/authorize',
  DBX_TOKEN_PATH: '/oauth2/token',
  DBX_APP_KEY: config.parsed.DBX_APP_KEY,
  DBX_APP_SECRET: config.parsed.DBX_APP_SECRET,
  OAUTH_REDIRECT_URL: 'http://localhost:3000/oauthredirect'
}
