const winston = require('winston')
const logger = winston.createLogger()

logger.add(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  level: process.env.LOGGING_LEVEL || 'silly'
}))

const TwitchAPI = require('./TwitchAPI')
const twitch = new TwitchAPI({ logger })

const SakurasDiscordBot = require('./SakurasDiscordBot')
const discordClient = new SakurasDiscordBot({ twitch, logger })

logger.info('Connecting to Discord...')
discordClient.login(process.env.DISCORD_TOKEN)

discordClient.on('ready', () => {
  logger.info(`Connected to Discord as ${discordClient.user.tag}`)
})