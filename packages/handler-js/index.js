// const jsprocess = require("zero-process")
// var handler = require("./handler")

// function wrapProcess(req, res, basePath, entryFile, lambdaType, serverAddress, BundlePath){
//   //start the process
//   jsprocess(handler, basePath, entryFile, lambdaType, serverAddress, BundlePath)
// }

module.exports = {
  //process: require.resolve("./process.js"),
  handler: require.resolve("./handler"),
  getRelatedFiles: require("zero-dep-tree-js").getRelativeFiles
}