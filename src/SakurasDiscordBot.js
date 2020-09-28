const { Client } = require('discord.js')

module.exports = class SakurasDiscordBot extends Client {
  constructor ({ logger, twitch, pool } = {}) {
    super({
      presence: {
        activity: {
          name: '-stream',
          type: 'WATCHING'
        }
      },
      ws: {
        intents: [
          'GUILDS',
          'GUILD_MESSAGES'
        ]
      }
    })

    this.logger = logger || console
    this.twitch = twitch
    this.pool = pool
    this.prefix = process.env.PREFIX || '-'

    this.on('ready', () => {
      logger.info(`Connected to Discord as ${this.user.tag}`)
    })

    this.on('message', async message => {
      this.logger.debug(`[${message.guild.name}] #${message.channel.name} <${message.author.tag}> ${message.content}`)

      if (message.author.bot) return

      const safePrefix = this.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const commandRegex = new RegExp(`(${safePrefix}stream|<@!?${this.user.id}>) ?(.*)?`)

      this.logger.info(`Bot invoked on Discord by <${message.author.tag}> at #${message.channel.name} in [${message.guild.name}]`)

      const contentMatch = commandRegex.exec(message.content)
      if (!contentMatch) return

      let game = null
      if (contentMatch[2]) game = await this.twitch.getGame(contentMatch[2])

      if (contentMatch[2] && !game) return message.reply('não encontrei nenhum jogo com esse nome :/')

      message.channel.startTyping()
      const stream = await this.twitch.getRandomOnlineStream(this.pool.streamers, game)

      if (stream) {
        if (game) {
          await message.reply(`que tal a stream da **${stream.user_name}**? Ela está online agora jogando **${game.name}**! <https://twitch.tv/${stream.user_name}>`)
        } else {
          await message.reply(`que tal a stream da **${stream.user_name}**? Ela está online agora! <https://twitch.tv/${stream.user_name}>`)
        }
      } else {
        if (game) {
          await message.reply(`nenhuma streamer está streamando **${game.name}** no momento :(`)
        } else {
          await message.reply('nenhuma streamer está online no momento :(')
        }
      }

      message.channel.stopTyping()
    })
  }
}