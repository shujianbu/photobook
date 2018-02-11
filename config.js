'use strict'
const config = require('dotenv').config()

module.exports = {
  DBX_API_DOMAIN: 'https://api.dropboxapi.com',
  DBX_OAUTH_DOMAIN: 'https://www.dropbox.com',
  DBX_OAUTH_PATH: '/oauth2/authorize',
  DBX_TOKEN_PATH: '/oauth2/token',
  DBX_APP_KEY: config.parsed.DBX_APP_KEY,
  DBX_APP_SECRET: config.parsed.DBX_APP_SECRET,
  OAUTH_REDIRECT_URL: 'http://localhost:3000/oauthredirect',
  DBX_LIST_FOLDER_PATH: '/2/files/list_folder',
  DBX_LIST_FOLDER_CONTINUE_PATH: '/2/files/list_folder/continue',
  DBX_GET_TEMPORARY_LINK_PATH: '/2/files/get_temporary_link'
}
