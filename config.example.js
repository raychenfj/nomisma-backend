const config = {
  development: {
    sparkPostApiKey: 'YOUR_API_KEY_HERE',
    sendGridApiKey: 'YOUR_API_KEY_HERE'
  },
  production: {
    sparkPostApiKey: 'YOUR_API_KEY_HERE',
    sendGridApiKey: 'YOUR_API_KEY_HERE'
  }
}

module.exports = config[process.env.NODE_ENV || 'development']
