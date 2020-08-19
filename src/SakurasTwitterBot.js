const Twit = require('twit')

module.exports = class SakurasTwitterBot extends Twit {
  constructor ({ logger, twitch, pool } = {}) {
    super({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token: process.env.TWITTER_ACCESS_TOKEN,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    })

    this.logger = logger || console
    this.twitch = twitch
    this.pool = pool

    this.streamConnection = this.stream('statuses/filter', { track: '@SakurasBot' })

    this.streamConnection.on('disconnect', disconnectMessage => {
      this.logger.warn('Twitter Stream connection closed')
    })

    this.streamConnection.on('connect', request => {
      this.logger.info('Connecting to Twitter...')
    })

    this.streamConnection.on('connected', response => {
      this.logger.info('Connected to Twitter')
    })

    this.streamConnection.on('tweet', async tweet => {
      this.logger.info(`Bot invoked on Twitter by @${tweet.user.screen_name} https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
      const stream = await this.twitch.getRandomOnlineStream(this.pool.streamers)
      this.post('statuses/update', {
        status: `Oi, @${tweet.user.screen_name}! Que tal a stream da ${stream.user_name}? Ela está online agora!\n\nhttps://twitch.tv/${stream.user_name}`,
        in_reply_to_status_id: tweet.id_str,
        auto_populate_reply_metadata: true
      }).catch(error => {
        this.logger.error(error)
      })
    })
  }
}