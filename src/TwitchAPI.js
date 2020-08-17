const axios = require('axios').default

module.exports = class TwitchAPI {
  constructor ({ logger } = {}) {
    this.logger = logger || console

    this.clientId = process.env.TWITCH_CLIENT_ID
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET
    
    this.accessToken = null
    this.accessTokenExpiry = null

    this.idBaseURL = 'https://id.twitch.tv'
    this.idAxios = axios.create({
      baseURL: this.idBaseURL
    })

    this.apiBaseURL = 'https://api.twitch.tv/helix'
    this.apiAxios = axios.create({
      baseURL: this.apiBaseURL
    })
    
    this.apiAxios.interceptors.request.use(async config => {
      if (Date.now() > this.accessTokenExpiry) await this.refreshAccessToken()
      config.headers = {
        'Client-ID': this.clientId,
        'Authorization': `Bearer ${this.accessToken}`
      }
      return config
    })
    
    this.apiAxios.interceptors.response.use(response => {
      return response
    }, async error => {
      const requestConfig = error.config
      if (error.response.status === 403 && !requestConfig.hasBeenRetried) {
        request.hasBeenRetried = true
        await this.refreshAccessToken()
        requestConfig.headers = {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${this.accessToken}`
        }
        return this.apiAxios(requestConfig)
      }
      return Promise.reject(error)
    })
  }

  async refreshAccessToken () {
    await this.idAxios.post('/oauth2/token', null, {
      params: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials'
      }
    }).then(res => {
      this.accessToken = res.data.access_token
      this.accessTokenExpiry = Date.now() + (res.data.expires_in * 1000)
    })
  }

  async getOnlineStreams (usernames) {
    return this.apiAxios.get('/streams', {
      params: usernames.reduce((previous, current) => {
        previous.append('user_login', current)
        return previous
      }, new URLSearchParams())
    }).then(res => res.data.data)
  }

  async getRandomOnlinestream (usernames) {
    const streams = await this.getOnlineStreams(usernames)
    if (streams.length === 0) return null
    return (streams[Math.floor(Math.random() * streams.length)])
  }
}