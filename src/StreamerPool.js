const { EventEmitter } = require('events')
const fs = require('fs')

module.exports = class StreamerPool extends EventEmitter {
  constructor ({ twitch, logger, username }) {
    super()

    this.twitch = twitch
    this.logger = logger || console
    this.username = username

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

  async update () {
    this.logger.info('Updating Streamer Pool')
    if (this.username) {
      await this.loadFromTwitchFollowing(this.username)
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