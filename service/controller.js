'use strict'

const rp = require('request-promise')
const config = require('./config')

/**
 * Get temporary links for a set of files in the root folder of the app
 * 1. Get a list of all the paths of files in the folder
 * 2. Fetch a temporary link for each file in the folder
 * @param {string} token
 */
module.exports.getLinksAsync = async token => {
  //List images from the root of the app folder
  let result = await listImagePathsAsync(token, '')

  //Get a temporary link for each of those paths returned
  let temporaryLinkResults = await getTemporaryLinksForPathsAsync(
    token,
    result.paths,
  )
  var temporaryLinks = temporaryLinkResults.map(entry => entry.link)

  return temporaryLinks
}

/**
 * Returns an object containing an array with the path_lower of each
 * image file and if more files a cursor to continue
 * @param {string} token
 * @param {string} path
 */
const listImagePathsAsync = async (token, path) => {
  let options = {
    url: config.DBX_API_DOMAIN + config.DBX_LIST_FOLDER_PATH,
    headers: { Authorization: 'Bearer ' + token },
    method: 'POST',
    json: true,
    body: { path: path },
  }

  try {
    let result = await rp(options)

    //Filter response to images only
    let entriesFiltered = result.entries.filter(function(entry) {
      return entry.path_lower.search(/\.(gif|jpg|jpeg|tiff|png)$/i) > -1
    })

    //Get an array from the entries with only the path_lower fields
    var paths = entriesFiltered.map(entry => entry.path_lower)

    //return a cursor only if there are more files in the current folder
    let response = {}
    response.paths = paths
    if (result.hasmore) response.cursor = result.cursor
    return response
  } catch (error) {
    return new Error('error listing folder. ' + error.message)
  }
}

//Returns an array with temporary links from an array with file paths
/**
 *
 * @param {string} token
 * @param {string} paths
 */
const getTemporaryLinksForPathsAsync = (token, paths) => {
  var promises = []
  let options = {
    url: config.DBX_API_DOMAIN + config.DBX_GET_TEMPORARY_LINK_PATH,
    headers: { Authorization: 'Bearer ' + token },
    method: 'POST',
    json: true,
  }

  //Create a promise for each path and push it to an array of promises
  paths.forEach(path_lower => {
    options.body = { path: path_lower }
    promises.push(rp(options))
  })

  //returns a promise that fullfills once all the promises in the array complete or one fails
  return Promise.all(promises)
}
