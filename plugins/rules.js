let fs = require('fs')
let moment = require('moment-timezone')
let handler = async (m, { conn, usedPrefix, __dirname, text, command }) => {
let tag = `@${m.sender.replace(/@.+/, '')}`
  let mentionedJid = [m.sender]
let name = conn.getName(m.sender)
let esce = `text nya `
let flaaa2 = [
'https://flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=water-logo&script=water-logo&fontsize=90&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextColor=%23000&shadowGlowColor=%23000&backgroundColor=%23000&text=',
'https://flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=crafts-logo&fontsize=90&doScale=true&scaleWidth=800&scaleHeight=500&text=',
'https://flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=amped-logo&doScale=true&scaleWidth=800&scaleHeight=500&text=',
'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextType=1&fillTextPattern=Warning!&text=',
'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextType=1&fillTextPattern=Warning!&fillColor1Color=%23f2aa4c&fillColor2Color=%23f2aa4c&fillColor3Color=%23f2aa4c&fillColor4Color=%23f2aa4c&fillColor5Color=%23f2aa4c&fillColor6Color=%23f2aa4c&fillColor7Color=%23f2aa4c&fillColor8Color=%23f2aa4c&fillColor9Color=%23f2aa4c&fillColor10Color=%23f2aa4c&fillOutlineColor=%23f2aa4c&fillOutline2Color=%23f2aa4c&backgroundColor=%23101820&text=']
let rules = `*𝙱𝚊𝚌𝚊 𝙹𝚊𝚗𝚐𝚊𝚗 𝙽𝚐𝚎𝚋𝚞𝚝𝚊 𝚠𝚔*
❖ 𝙽𝚘 𝚜𝚙𝚊𝚖 𝙲𝚘𝚖𝚖𝚊𝚗𝚍
❖ 𝙽𝚘 𝚂𝚎𝚗𝚍 𝙱𝚞𝚐 𝚔𝚎 𝙱𝚘𝚝 & 𝙾𝚠𝚗𝚎𝚛
❖ 𝙽𝚘 𝚃𝚎𝚕𝚏𝚘𝚗 & 𝚟𝚌 𝙱𝚘𝚝
❖ 𝙽𝚘 𝚃𝚎𝚕𝚏𝚘𝚗 & 𝚅𝚌 𝙾𝚠𝚗𝚎𝚛
❖ 𝙽𝚘 𝙷𝚒𝚗𝚊 𝙱𝚘𝚝
❖ 𝙹𝚒𝚔𝚊 𝙼𝚎𝚕𝚊𝚗𝚐𝚐𝚊𝚛 𝙰𝚞𝚝𝚘 𝙱𝚕𝚘𝚌𝚔
❖ 𝙹𝚊𝚗𝚐𝚊𝚗 𝙻𝚞𝚙𝚊 𝙳𝚘𝚗𝚊𝚜𝚒 𝙲𝚘𝚔
❏┳━━◩
┍┛
┆⫹⫺ 𝙷𝚊𝚕𝚘 𝙺𝚊𝚔 ${name}
└─┈⟅`
let nth = `*𝚁𝚞𝚕𝚎𝚜 𝙵𝚛𝚛𝚕𝙳𝚏𝚗𝚒𝚇𝟽-𝙼𝚞𝚕𝚝𝚒𝙳𝚎𝚟𝚒𝚌𝚎*`
conn.send3ButtonImg(m.chat, `${pickRandom(flaaa2)}` + `${ucapan()} ` + `${name}`, nth, rules, 'Sosial Media', '.sosialmedia', 'Owner', '.owner', 'Donasi', '.donasi', m, { contextInfo: { externalAdReply: { showAdAttribution: true,
    mediaUrl: 'http://Wa.me/6282298463886?text=Hai+Bang+FrrlDfniX7🌻',
    mediaType: 2, 
    description: gc,
    title: "Sᴇᴡᴀ Cʜᴀᴛ ᴏᴡɴᴇʀ!!!",
    body: wm,
    thumbnail: fs.readFileSync('thumbnail.jpg'),
    sourceUrl: 'https://wa.me/6282298463886',
     }}
  })
}
handler.help = ['rules']
handler.tags = ['info']
handler.command = /^(rules)$/i

module.exports = handler

function ucapan() {
  const time = moment.tz('Asia/Jakarta').format('HH')
  let res = "Selamat Malam"
  if (time >= 4) {
    res = "Selamat Pagi"
  }
  if (time >= 10) {
    res = "Selamat Siang"
  }
  if (time >= 15) {
    res = "Selamat Sore"
  }
  if (time >= 18) {
    res = "Selamat Malam"
  }
  return res
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)