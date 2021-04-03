const winston = require('winston')
let logger = winston.createLogger()

const TwitchAPI = require('./TwitchAPI')
const StreamerPool = require('./StreamerPool')
const SakurasDiscordBot = require('./SakurasDiscordBot')
const SakurasTwitterBot = require('./SakurasTwitterBot')
const SakurasTelegramBot = require('./SakurasTelegramBot')

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

const twitter = new SakurasTwitterBot({ logger: logger, twitch, pool })
const discordClient = new SakurasDiscordBot({ logger, twitch, pool, })
const telegram = new SakurasTelegramBot({ logger, twitch, pool })

pool.initialize(process.env.STEIN_URL ? 90 : 10)

pool.once('ready', () => {
  logger.info('Connecting to Discord...')
  discordClient.login()
  twitter.start()
  telegram.launch()
})