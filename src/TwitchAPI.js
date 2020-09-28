const axios = require('axios').default
const fs = require('fs')

module.exports = class TwitchAPI {
  constructor ({ logger, streamers } = {}) {
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
      if (error.response && error.response.status === 403 && !requestConfig.hasBeenRetried) {
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
    this.logger.debug('Refreshing Twitch Access Token')
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

  async getOnlineStreams (streamers, game) {
    return this.apiAxios.get('/streams', {
      params: streamers.reduce((previous, current) => {
        previous.append('user_login', current)
        return previous
      }, new URLSearchParams(`?first=100${game ? `&game_id=${game.id}` : ''}`))
    }).then(res => res.data.data)
  }

  async getRandomOnlineStream (streamers, game) {
    const streams = await this.getOnlineStreams(streamers, game)
    if (streams.length === 0) return null
    return (streams[Math.floor(Math.random() * streams.length)])
  }

  async getUser (user) {
    return this.apiAxios.get('/users', {
      params: {
        login: user
      }
    }).then(res => res.data.data[0])
  }

  async getUserFollowing (user) {
    const { id } = await this.getUser(user)
    return this.apiAxios.get('/users/follows', {
      params: {
        from_id: id,
        first: 100
      }
    }).then(res => res.data.data)
  }

  async getGame (name) {
    return this.apiAxios.get('/games', {
      params: {
        name
      }
    }).then(res => res.data.data[0])
  }
}