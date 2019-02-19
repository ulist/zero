module.exports = {
  //process: require.resolve("./process.js"),
  handler: require.resolve("./handler"),
  config: {
    // in dev mode, parcel provides HMR
    restartOnFileChange: process.env.NODE_ENV==="production"
  }
}