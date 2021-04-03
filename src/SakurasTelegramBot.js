const { Telegraf } = require("telegraf");

module.exports = class SakurasTelegramBot extends Telegraf {
  constructor ({ logger, twitch, pool }) {
    super (process.env.TELEGRAM_TOKEN) 
  
    this.logger = logger
    this.twitch = twitch
    this.pool = pool

    this.command('start', ctx => {
      ctx.reply('Olá! Digite /stream para receber o link de uma streamer!')
    })

    this.command('stream', async ctx => {
      this.logger.debug(`(TELEGRAM)${ctx.chat.title ? ` [${ctx.chat.title}]` : ''} <${ctx.from.username}> ${ctx.message.text}`)

      ctx.telegram.sendChatAction(ctx.chat.id, 'typing')

      const args = ctx.message.text.split(' ').slice(1).join(' ')
      
      let game
      if (args) {
        game = await this.twitch.getGame(args)
        if (!game) {
          ctx.reply('Não encontrei nenhum jogo com esse nome :(')
        }
      }

      const stream = await this.twitch.getRandomOnlineStream(this.pool.streamers, game)

      if (stream) {
        if (game) {
          ctx.reply(`Que tal a stream da ${stream.user_name}? Ela está online agora!\n\nhttps://twitch.tv/${stream.user_name}`)
        } else {
          ctx.reply(`Infelizmente, nenhuma das nossas streamers está online agora :(`)
        }
      } else {
        if (game) {
          ctx.reply(`Infelizmente, nenhuma streamer está streamando ${game.name} agora :(`)
        } else {
          ctx.reply(`Nenhuma streamer está online no momento :(`)
        }
      }
    })
  }
}