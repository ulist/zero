const mkdirp = require('mkdirp')
const path = require('path')
const bundle = require('./bundle')
const fs = require('fs')

var isBundled = {}
module.exports = async (req, res, file, bundlePath)=>{
  // generate a bundle if not present already
  bundlePath = bundlePath + "/html.static" // this causes router to serve our html as static files
  var fullBundlePath = path.join(process.env.BUILDPATH, bundlePath)
  if (!isBundled[file]){
    mkdirp.sync(fullBundlePath)
    const stats = await bundle(file, fullBundlePath, bundlePath)
    isBundled[file] = true
  }

  res.sendFile(path.join(fullBundlePath, "index.html"))
}
