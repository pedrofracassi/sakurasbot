const { Client } = require('discord.js')

module.exports = class SakurasDiscordBot extends Client {
  constructor (options = {}) {
    super(options)

    this.logger = options.logger || console
    this.twitch = options.twitch

    this.on('message', async message => {
      this.logger.debug(`[${message.guild.name}] #${message.channel.name} <${message.author.tag}> ${message.content}`)

      if (message.author.bot) return
      
      if ([`<@!${this.user.id}>`, `<@${this.user.id}>`].includes(message.content) || message.content === '-stream') {
        this.logger.info(`Bot invoked by ${message.author.tag} at #${message.channel.name} in ${message.guild.name}`)

        message.channel.startTyping()
        const stream = await this.twitch.getRandomOnlineStream()
        
        if (stream) {
          await message.reply(`que tal a stream da **${stream.user_name}**? Ela está online agora!\n<https://twitch.tv/${stream.user_name}>`)
        } else {
          await message.reply('nenhuma das nossas streamers está online no momento \:(')
        }

        message.channel.stopTyping()
      }
    })
  }
}