const { EventEmitter } = require('events')
const fs = require('fs')

const axios = require('axios').default

// (?:https?:\/\/)?(?:www.)?(?:twitch.tv\/)?([0-9a-zA-Z_]*)

const twitchRegex = /(?:https?:\/\/)?(?:www.)?(?:twitch.tv\/)?([0-9a-zA-Z_]*)/

module.exports = class StreamerPool extends EventEmitter {
  constructor ({ twitch, logger, username }) {
    super()

    this.twitch = twitch
    this.logger = logger || console
    this.username = username
    this.steinUrl = process.env.STEIN_URL
    this.steinKey = process.env.STEIN_KEY

    this.streamers = []
  }

  async initialize (interval) {
    this.logger.info(`Streamer Pool initializing. Updates every ${interval} minutes.`)
    await this.update()
    this.logger.info('Streamer Pool is ready')
    this.emit('ready')
    setInterval(() => {
      this.update()
    }, interval * 60 * 1000)
  }

  async loadFromTwitchFollowing (user) {
    this.logger.info(`Loading streamers from ${user}'s followed users.`)
    this.streamers = await this.twitch.getUserFollowing(user).then(res => res.map(user => user.to_name))
  }

  loadFromTextFile () {
    this.logger.info(`Loading streamers from the streamers.txt file.`)
    this.streamers = fs.readFileSync('streamers.txt').toString().split('\r\n')
  }

  async loadFromGoogleSheets () {
    this.logger.info(`Loading streamers from SteinHQ sheet`)
    const res = await axios.get(this.steinUrl).then(res => res.data)
    this.streamers = res.map(l => twitchRegex.exec(l[this.steinKey])[1])   
  }

  async update () {
    this.logger.info('Updating Streamer Pool')
    if (this.username) {
      await this.loadFromTwitchFollowing(this.username)
    } else if (this.steinKey && this.steinUrl) {
      await this.loadFromGoogleSheets()
    } else {
      this.loadFromTextFile()
    }

    if (this.streamers.length > 0) {
      this.logger.info(`Got ${this.streamers.length} streamers.`)
      this.logger.debug(this.streamers)
    } else {
      this.logger.error('Got no streamers. Shutting down.')
      process.exit(0)
    }

    return true
  }
}