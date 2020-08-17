const fs = require('fs')

console.log('Loading streamer list...')

const streamers = fs.readFileSync('streamers.txt').toString().split('\n')

console.log(`Loaded ${streamers.length} streamers`)

const TwitchAPI = require('./TwitchAPI')
const twitch = new TwitchAPI(streamers)

const SakurasDiscordBot = require('./SakurasDiscordBot')
const discord = new SakurasDiscordBot({ twitch })

discord.login(process.env.DISCORD_TOKEN)