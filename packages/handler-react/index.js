module.exports = {
  //process: require.resolve("./process.js"),
  handler: require.resolve("./renderer"),
  getRelatedFiles: require("zero-dep-tree-js").getRelativeFiles,
  config: {
    // in dev mode, parcel provides HMR
    restartOnFileChange: process.env.NODE_ENV==="production"
  }
}