const { Client } = require('discord.js')

module.exports = class SakurasDiscordBot extends Client {
  constructor (options = {}) {
    super(options)

    this.logger = options.logger || console
    this.twitch = options.twitch

    this.on('message', async message => {
      if (message.author.bot) return
      if (message.content === `<@!${this.user.id}>`) {
        message.channel.startTyping()
        const stream = await this.twitch.getRandomOnlinestream()
        
        if (stream) {
          await message.reply(`que tal a stream da **${stream.user_name}**?\n<https://twitch.tv/${stream.user_name}>`)
        } else {
          await message.reply('nenhuma das nossas streamers está online no momento \:(')
        }

        message.channel.stopTyping()
      }
    })
  }
}