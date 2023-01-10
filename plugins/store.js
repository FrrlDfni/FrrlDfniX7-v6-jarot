let { MessageType } = require('@adiwajshing/baileys')
let fs = require('fs')
let moment = require('moment-timezone')
let handler  = async (m, { conn, command, args, usedPrefix, DevMode }) => {
  let type = (args[0] || '').toLowerCase()
  let _type = (args[0] || '').toLowerCase()

  let teks = `【 𝚂𝚘𝚜𝚒𝚊𝚕 𝙼𝚎𝚍𝚒𝚊 𝙵𝚛𝚛𝚕𝙳𝚏𝚗𝚒𝚇𝟽 】`
const sections = [
   {
	title: ` 𝚂𝚞𝚙𝚘𝚛𝚝 𝙼𝚎`,
	rows: [
	{title: `𝙰𝚕𝚕 𝚂𝚌𝚛𝚒𝚙𝚝`, rowId: ".sc", description: "𝙹𝚊𝚗𝚐𝚊𝚗 𝙻𝚞𝚙𝚊 𝙺𝚊𝚜𝚒𝚑 𝚂𝚝𝚊𝚛"},
	{title: `𝙼𝚢 𝚈𝚘𝚞𝚝𝚞𝚋𝚎`, rowId: ".ytowner", description: "𝙹𝚊𝚗𝚐𝚊𝚗 𝙻𝚞𝚙𝚊 𝚂𝚞𝚋𝚜𝚌𝚛𝚒𝚋𝚎"},
	{title: `𝙼𝚢 𝙸𝚗𝚜𝚝𝚊𝚐𝚛𝚊𝚖`, rowId: ".igowner", description: "𝙹𝚊𝚗𝚐𝚊𝚗 𝙻𝚞𝚙𝚊 𝙵𝚘𝚕𝚕𝚘𝚠 𝚃𝚘𝚍"},
]
  },{
	title: ` 𝙶𝚛𝚘𝚞𝚙 𝙱𝚘𝚝 𝙾𝚏𝚏𝚌`,
	rows: [
	    	{title: `𝙶𝚛𝚘𝚞𝚙 𝙱𝚘𝚝 𝟷`, rowId: ".gc", description: "𝙹𝚊𝚗𝚐𝚊𝚗 𝙻𝚞𝚙𝚊 𝙹𝚘𝚒𝚗 𝚃𝚘𝚍"},
	{title: `𝙶𝚛𝚘𝚞𝚙 𝙱𝚘𝚝 𝟸`, rowId: ".gc2", description: "𝙹𝚊𝚗𝚐𝚊𝚗 𝙻𝚞𝚙𝚊 𝙱𝚊𝚌𝚊 𝚁𝚞𝚕𝚎𝚜!"},
	]
  },{
	title: ` SUPPORT ME –––––––·•`,
	rows: [
	    {title: "💹 • Donasi", rowId: ".owner nomor"},
	{title: "🔖 • Sewa", rowId: ".sewa"},
	{title: "🌟 • Buy Premium", rowId: ".premium"},
	]
  },
]

//FAKEREPLY KONTAK
 const fcon = {
	 key:
	 { fromMe: false,
	 participant: `0@s.whatsapp.net`, ...(m.chat ? 
	 { remoteJid: "status@broadcast" } : {}) },
	 message: { "contactMessage": { "title":"sri","h": `haloo`, 'jpegThumbnail': fs.readFileSync('./image/3SBot.jpg')}}
	}

const listMessage = {
  text: ` `,
  footer: teks,
  title: 'ᴄʟɪᴄᴋ ʙᴜᴛᴛᴏɴ ɴᴏᴡ!',
  buttonText: "ᴄʟɪᴄᴋ",
  sections
}
await conn.sendMessage(m.chat, listMessage, { quoted: fcon, mentions: await conn.parseMention(teks), contextInfo:{ forwardingScore: 99999, isForwarded: true }})
}

handler.help = ['sosialmedia']
handler.tags = ['info']
handler.command = /^(sosialmedia)/i
handler.register = true

module.exports = handler