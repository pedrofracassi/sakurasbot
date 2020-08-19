const winston = require('winston')
const logger = winston.createLogger()

const TwitchAPI = require('./TwitchAPI')
const StreamerPool = require('./StreamerPool')
const SakurasDiscordBot = require('./SakurasDiscordBot')
const SakurasTwitterBot = require('./SakurasTwitterBot')

logger.add(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(
      info => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  level: process.env.LOGGING_LEVEL || 'silly'
}))

const twitch = new TwitchAPI({ logger })
const pool = new StreamerPool({ logger, twitch, username: process.env.TWITCH_CONTROLLER_USERNAME })
const discordClient = new SakurasDiscordBot({ logger, twitch, pool, })

pool.initialize(10)

pool.once('ready', () => {
  logger.info('Connecting to Discord...')
  discordClient.login(process.env.DISCORD_TOKEN)
  new SakurasTwitterBot({ logger, twitch, pool })
})