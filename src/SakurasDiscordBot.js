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

    this.on('ready', () => {
      logger.info(`Connected to Discord as ${this.user.tag}`)
    })

    this.on('message', async message => {
      this.logger.debug(`[${message.guild.name}] #${message.channel.name} <${message.author.tag}> ${message.content}`)

      if (message.author.bot) return
      
      if ([`<@!${this.user.id}>`, `<@${this.user.id}>`].includes(message.content) || message.content === '-stream') {
        this.logger.info(`Bot invoked by <${message.author.tag}> at #${message.channel.name} in [${message.guild.name}]`)

        message.channel.startTyping()
        const stream = await this.twitch.getRandomOnlineStream(this.pool.streamers)
        
        if (stream) {
          await message.reply(`que tal a stream da **${stream.user_name}**? Ela está online agora! <https://twitch.tv/${stream.user_name}>`)
        } else {
          await message.reply('nenhuma das nossas streamers está online no momento \:(')
        }

        message.channel.stopTyping()
      }

      if (message.content === '-ping') {
        message.channel.send('Pong!')
      }
    })
  }
}