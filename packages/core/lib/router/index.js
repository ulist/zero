/*
 When a user hits a url which is a lambda, the router starts a new 
 http server in a separate child process. The child process returns the port.
 The router then proxies the request to that server.
 The router also maintains a map {} to avoid creating new processes for
 same url when it's hit again.

 Static files are handled in the current process.
*/

const express = require('express')
const matchPath = require("./matchPath")
const staticHandler = require("zero-static").handler
const path = require('path')
const url = require("url")
const handlers = require('../handlers')
const fetch = require("node-fetch")
const debug = require('debug')('core')
const ora = require('ora');
const del = require('del');
const session = require('zero-express-session')
const routeVM = require('./routeVM')

var getLambdaID = function(entryFile){
  return require("crypto").createHash('sha1').update(entryFile).digest('hex')
}

async function handleRequest(req, res, endpointData){
  // const spinner = ora({
  //   color: 'green',
  //   spinner: "star"
  // })
  var lambdaID = getLambdaID(endpointData[1])
  //console.log("lambdaID", endpointData, lambdaID)
  // if (!lambdaIdToPortMap[lambdaID]){
  //   spinner.start("Building " + url.resolve("/", endpointData[0]))
  // }
  if (!process.env.SERVERADDRESS){
    process.env.SERVERADDRESS = "http://"+req.headers.host
  }

  const handler = getLambdaServerHandler(endpointData)
  routeVM(handler, req, res, endpointData[0], endpointData[1], endpointData[2], process.env.SERVERADDRESS, "zero-builds/" + lambdaID)
  //handler(req, res, endpointData[0], endpointData[1], endpointData[2], process.env.SERVERADDRESS, "zero-builds/" + lambdaID)
}

function getLambdaServerHandler(endpointData){
  return handlers[endpointData[2]].handler
}

module.exports = (buildPath)=>{
  const app = express()
  // bootstrap express app with session
  session(app)

  app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('body-parser').json());
  
  var manifest = {lambdas:[], fileToLambdas:{}}
  var forbiddenStaticFiles = []
  app.all("*", (request, response)=>{
    var endpointData = matchPath(manifest, forbiddenStaticFiles, buildPath, request.url)
    debug("match", request.url, endpointData)
    if (endpointData){
      // call relevant handler as defined in manifest
      return handleRequest(request, response, endpointData)
    }
    // catch all handler
    return staticHandler(request, response)
  })

  var listener = app.listen(process.env.PORT, () => {
    debug("Running on port", listener.address().port)
  })

  return (newManifest, newForbiddenFiles, filesUpdated)=>{
    debug("updating manifest in server")
    manifest = newManifest;
    forbiddenStaticFiles = newForbiddenFiles

    // kill and restart servers 
    /*if (filesUpdated){
      filesUpdated.forEach(async file=>{
        var lambdaID = getLambdaID(file)
        if (lambdaIdToPortMap[lambdaID] && lambdaIdToPortMap[lambdaID].process && shouldKillOnChange(lambdaIdToPortMap[lambdaID].endpointData)) {
          debug("killing", file, lambdaIdToPortMap[lambdaID].port)
          lambdaIdToPortMap[lambdaID].process.kill()
          // delete their bundle if any
          await del(path.join(process.env.BUILDPATH, "zero-builds", lambdaID, "/**"), {force: true})
          // start the process again
          var endpointData = newManifest.lambdas.find((lambda)=>{
            return lambda[1]===file
          })

          delete lambdaIdToPortMap[lambdaID]
          debug("starting", endpointData)
          if (endpointData) getLambdaServerHandler(endpointData)
        }
      })
    }
    else{
      // kill all servers
      for (var file in lambdaIdToPortMap){
        if (lambdaIdToPortMap[getLambdaID(file)])
          lambdaIdToPortMap[getLambdaID(file)].process.kill()
      }
    }*/
  }
}

function shouldKillOnChange(endpointData){
  // get config for this lambda type and see if we 
  // should restart the process or will the handler manage itself (hmr etc)
  const config = handlers[endpointData[2]]? handlers[endpointData[2]].config : false
  if (config){
    if (config.restartOnFileChange===false) return false
  }

  // no config, default to killing
  return true
}
