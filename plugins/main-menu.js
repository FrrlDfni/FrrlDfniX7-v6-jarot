let levelling = require('../lib/levelling')
let fs = require('fs')
let path = require('path')
let fetch = require('node-fetch')
let moment = require('moment-timezone')
const defaultMenu = {
  before: `
┌────〔 %me 〕───⬣
│⬡ Hai, %name!
│⬡ Tersisa *%limit Limit*
│⬡ Role *%role*
│⬡ Level *%level (%exp / %maxexp)*
│⬡ [%xp4levelup]
│⬡ %totalexp XP secara Total
│⬡ Hari: *%week %weton*
│⬡ Tanggal: %date
│⬡ Waktu: *%time*
│⬡ Uptime: *%uptime (%muptime)*
│⬡ Database: %rtotalreg dari %totalreg
╰────────────⬣`.trim(),
  header: '*┌──〔 %category〕*',
  body: '*│*⦁ %cmd %islimit %isPremium',
  footer: '*└────⦁*\n',
  after: `
*%npmname@^%version*
${'```%npmdesc```'}
`,
}
let handler = async (m, { conn, usedPrefix: _p, args, command }) => {

  let tags
  let teks = `${args[0]}`.toLowerCase()
  let arrayMenu = ['all', 'game', 'xp', 'stiker', 'image', 'anime', 'kerangajaib', 'quotes', 'rpg', 'grup', 'premium', 'internet', 'anonymous', 'nulis', 'downloader', 'tools', 'fun', 'database', 'quran', 'audio', 'jadibot', 'info', 'vote', 'tanpakategori', 'owner']
  if (!arrayMenu.includes(teks)) teks = '404'
  if (teks == 'all') tags = {
    'main': 'Utama',
    'game': 'Game',
    'xp': 'Exp & Limit',
    'sticker': 'Stiker',
    'kerang': 'Kerang Ajaib',
    'quotes': 'Quotes',
    'rpg': 'Epic Rpg',
    'group': 'Grup',
    'asupan': 'ASUPAN',
    'anime': 'Anime',
    'premium': 'Premium',
    'internet': 'Internet',
    'anonymous': 'Anonymous Chat',
    'nulis': 'MagerNulis & Logo',
    'downloader': 'Downloader',
    'tools': 'Tools',
    'fun': 'Fun',
    'database': 'Database',
    'vote': 'Voting',
    'absen': 'Absen',
    'quran': 'Islam',
    'audio': 'Pengubah Suara',
    'jadibot': 'Jadi Bot',
    'info': 'Info',
    '': 'Tanpa Kategori',
  }
  if (teks == 'game') tags = {
    'game': 'Game'
  }
  if (teks == 'xp') tags = {
    'xp': 'Exp & Limit'
  }
  if (teks == 'stiker') tags = {
    'sticker': 'Stiker'
  }
  if (teks == 'rpg') tags = {
    'rpg': 'Epic Rpg'
  }
  if (teks == 'kerangajaib') tags = {
    'kerang': 'Kerang Ajaib'
  }
  if (teks == 'quotes') tags = {
    'quotes': 'Quotes'
  }
  if (teks == 'grup') tags = {
    'group': 'Grup'
  }
  if (teks == 'premium') tags = {
    'premium': 'Premium'
  }
  if (teks == 'internet') tags = {
    'internet': 'Internet'
  }
  if (teks == 'asupan') tags = {
    'asupab': 'ASUPAN'
  }
  if (teks == 'anonymous') tags = {
    'anonymous': 'Anonymous Chat'
  }
  if (teks == 'nulis') tags = {
    'nulis': 'MagerNulis & Logo'
  }
  if (teks == 'downloader') tags = {
    'downloader': 'Downloader'
  }
  if (teks == 'tools') tags = {
    'tools': 'Tools'
  }
  if (teks == 'fun') tags = {
    'fun': 'Fun'
  }
  if (teks == 'database') tags = {
    'database': 'Database'
  }
  if (teks == 'vote') tags = {
    'vote': 'Voting',
    'absen': 'Absen'
  }
    if (teks == 'anime') tags = {
    'anime': 'Anime'
  }
  if (teks == 'quran') tags = {
    'quran': 'Islam'
  }
  if (teks == 'audio') tags = {
    'audio': 'Pengubah Suara'
  }
  if (teks == 'jadibot') tags = {
    'jadibot': 'Jadi Bot'
  }
  if (teks == 'info') tags = {
    'info': 'Info'
  }
  if (teks == 'tanpakategori') tags = {
    '': 'Tanpa Kategori'
  }
  if (teks == 'owner') tags = {
    'owner': 'Owner',
    'host': 'Host',
    'advanced': 'Advanced'
  }



  try {
    let package = JSON.parse(await fs.promises.readFile(path.join(__dirname, '../package.json')).catch(_ => '{}'))
    let { exp, limit, age, money, level, role, registered } = global.db.data.users[m.sender]
    let { min, xp, max } = levelling.xpRange(level, global.multiplier)
    let umur = `*${age == '-1' ? 'Belum Daftar*' : age + '* Thn'}`
    let name = registered ? global.db.data.users[m.sender].name : conn.getName(m.sender)
    let d = new Date(new Date + 3600000)
    let locale = 'id'
    // d.getTimeZoneOffset()
    // Offset -420 is 18.00
    // Offset    0 is  0.00
    // Offset  420 is  7.00
    let weton = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi'][Math.floor(d / 84600000) % 5]
    let week = d.toLocaleDateString(locale, { weekday: 'long' })
    let date = d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    let dateIslamic = Intl.DateTimeFormat(locale + '-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d)
    let time = d.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    })
    let _uptime = process.uptime() * 1000
    let _muptime
    if (process.send) {
      process.send('uptime')
      _muptime = await new Promise(resolve => {
        process.once('message', resolve)
        setTimeout(resolve, 1000)
      }) * 1000
    }
    let muptime = clockString(_muptime)
    let uptime = clockString(_uptime)
    global.jam = time
    let totalreg = Object.keys(global.db.data.users).length
    let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.help) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
        limit: plugin.limit,
        premium: plugin.premium,
        enabled: !plugin.disabled,
      }
    })
   const sections = [
{
title: `⃟⟣⟚⟝ ⟡ List Menu ${namebot} ⟡ ⟞⟚⟢⃟`,
rows: [
{title: `𝚂𝚎𝚖𝚞𝚊 𝙿𝚎𝚛𝚒𝚗𝚝𝚊𝚑`, rowId: ".? all", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀᴍ Semua Perintah"},
{title: `𝙼𝚎𝚗𝚞 𝙶𝚊𝚖𝚎 𝚁𝚙𝚐`, rowId: ".? rpg", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀᴍ Mᴇɴᴜ Rᴘɢ"},
{title: `𝙼𝚎𝚗𝚞 𝙴𝚡𝚙`, rowId: ".? xp", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Exᴘ"},
{title: `𝙼𝚎𝚗𝚞 𝙶𝚊𝚖𝚎`, rowId: ".? game", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Gᴇᴍᴇ"},
{title: `𝙼𝚎𝚗𝚞 𝙵𝚞𝚗`, rowId: ".? fun", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Fᴜɴ"},
{title: `𝙼𝚎𝚗𝚞 𝙺𝚎𝚛𝚊𝚗𝚐`, rowId: ".? kerangajaib", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Kᴇʀᴀɴɢ"},
{title: `𝙼𝚎𝚗𝚞 𝚀𝚞𝚘𝚝𝚎𝚜`, rowId: ".? quotes", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Qᴜᴏᴛᴇs"},
{title: `𝙼𝚎𝚗𝚞 𝙰𝚗𝚒𝚖𝚎`, rowId: ".? anime", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Aɴɪᴍᴇ"},
{title: `𝙼𝚎𝚗𝚞 𝙿𝚛𝚎𝚖𝚒𝚞𝚖`, rowId: ".? premium", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Pʀᴇᴍɪᴜᴍ"},
{title: `𝙼𝚎𝚗𝚞 𝙰𝚗𝚘𝚗𝚢𝚖𝚘𝚞𝚜 𝙲𝚑𝚊𝚝𝚜`, rowId: ".? anonymous", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Aɴᴏɴʏᴍᴏᴜs Cʜᴀᴛs"},
{title: `𝙼𝚎𝚗𝚞 𝙰𝚕-𝚀𝚞𝚛𝚊𝚗`, rowId: ".? quran", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Aʟ-Qᴜʀᴀɴ"},
{title: `𝙼𝚎𝚗𝚞 𝙸𝚗𝚝𝚎𝚛𝚗𝚎𝚝`, rowId: ".? internet", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Iɴᴛᴇʀɴᴇᴛ"},
{title: `𝙼𝚎𝚗𝚞 𝙱𝚎𝚛𝚒𝚝𝚊`, rowId: ".? berita", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Bᴇʀɪᴛᴀ"},
{title: `𝙼𝚎𝚗𝚞 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚎𝚛`, rowId: ".? downloader", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Dᴏᴡɴʟᴏᴀᴅᴇʀ"},
{title: `𝙼𝚎𝚗𝚞 𝚂𝚝𝚒𝚌𝚔𝚎𝚛`, rowId: ".? stiker", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Sᴛɪᴋᴇʀ"},
{title: `𝙼𝚎𝚗𝚞 𝙽𝚞𝚕𝚒𝚜`, rowId: ".? nulis", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Nᴜʟɪs"},
{title: `𝙼𝚎𝚗𝚞 𝙰𝚞𝚍𝚒𝚘`, rowId: ".? audio", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Aᴜᴅɪᴏ"},
{title: `𝙼𝚎𝚗𝚞 𝙶𝚛𝚘𝚞𝚙`, rowId: ".? group", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Gʀᴏᴜᴘ"},
{title: `𝙼𝚎𝚗𝚞 𝙳𝚊𝚝𝚊𝚋𝚊𝚜𝚎`, rowId: ".? database", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Dᴀᴛᴀʙᴀsᴇ"},
{title: `𝙼𝚎𝚗𝚞 𝚃𝚘𝚘𝚕𝚜`, rowId: ".? tools", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Tᴏᴏʟs"},
{title: `𝙼𝚎𝚗𝚞 𝙸𝚗𝚏𝚘`, rowId: ".? info", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Iɴғᴏ"},
{title: `𝙼𝚎𝚗𝚞 𝙾𝚠𝚗𝚎𝚛`, rowId: ".? owner", description: "Mᴇɴᴀᴍᴘɪʟᴋᴀɴ Mᴇɴᴜ Oᴡɴᴇʀ"},
]
}, {
title: `𝙱𝚊𝚗𝚝𝚞 𝚂𝚞𝚙𝚘𝚛𝚝 𝙼𝚎 ${namebot} `,
rows: [
{title: `⟐ 𝙳𝚘𝚗𝚊𝚜𝚒 ⟐`, rowId: ".donasi", description: "𝙳𝚘𝚗𝚊𝚜𝚒 𝙰𝚐𝚊𝚛 𝚂𝚎𝚖𝚊𝚗𝚐𝚊𝚝 𝚄𝚙𝚍𝚊𝚝𝚎 𝙱𝚘𝚝:)"},
{title: `⟐ 𝚂𝚎𝚠𝚊𝚋𝚘𝚝 ⟐`, rowId: ".sewa", description: "𝙼𝚊𝚞 𝙽𝚢𝚎𝚠𝚊?"},
{title: `⟐ 𝙾𝚠𝚗𝚎𝚛 ⟐`, rowId: ".owner", description: "𝙽𝚘𝚖𝚎𝚛 𝙲𝚛𝚎𝚊𝚝𝚘𝚛 𝙱𝚘𝚝"},
]}]
let psan = 'bagaimana kabarmu?'
let usrs = db.data.users[m.sender]
let fkontak = { key: { fromMe: false, participant: `0@s.whatsapp.net`, ...(m.chat ? { remoteJid: `status@broadcast` } : {}) }, message: { 'contactMessage': { 'displayName': wm, 'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:XL;${wm},;;;\nFN:${wm},\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabell:Ponsel\nEND:VCARD`, 'jpegThumbnail': fs.readFileSync('./thumbnail.jpg'), thumbnail: fs.readFileSync('./thumbnail.jpg'),sendEphemeral: true}}}
let tagnya = `@${m.sender.split`@`[0]}`

let jarot = `┏─────────────────⬣
┆ 𝑯𝒂𝒊, ${tagnya} 👋
┗┬──────────────┈ ⳹
┏┆♠︎ 𝙽𝚊𝚖𝚎 : ${usrs.registered ? usrs.name : conn.getName(m.sender)}
┃┆♠︎ 𝚂𝚝𝚊𝚝𝚞𝚜 : ${m.sender.split`@`[0] == owner ? 'Developer' : (usrs.premiumTime >= 1 ? 'Premium User' : 'Free User')}
┃┆♠︎𝙿𝚛𝚎𝚖𝚒𝚞𝚖 : ${usrs.premiumTime > 1 ? '✔ Ya': '✘ Tidak'}
┃┆♠︎𝚁𝚘𝚕𝚎 : ${usrs.role}
┃┆♠︎𝙻𝚒𝚖𝚒𝚝 : ${usrs.limit}
┃┆♠︎𝙻𝚎𝚟𝚎𝚕 : ${usrs.limit}
┗┬──────────────┈ ⳹
┏┤   𝐊𝐚𝐥𝐞𝐧𝐝𝐞𝐫
┆┗──────────────┈ ⳹
┆♠︎ 𝙷𝚊𝚛𝚒 : ${week} ${weton}
┆♠︎ 𝚄𝚙𝚝𝚒𝚖𝚎 : ${uptime}
┆♠︎ 𝚃𝚒𝚖𝚎 :  ${moment.tz('Asia/Jakarta').format('HH')} H${moment.tz('Asia/Jakarta').format('mm')} M${moment.tz('Asia/Jakarta').format('ss')} S
┆♠︎ 𝚃𝚊𝚗𝚐𝚐𝚊𝚕: ${date}
┗─────────────────⬣`
let hariRayaramadan = new Date('April 21, 2023 23:59:59') 
     let sekarangg = new Date().getTime() 
     let lebih = hariRayaramadan - sekarangg 
     let harii = Math.floor( lebih / (1000 * 60 * 60 * 24)); 
     let jamm = Math.floor( lebih % (1000 * 60 * 60 * 24) / (1000 * 60 * 60)) 
     let menitt = Math.floor( lebih % (1000 * 60 * 60) / (1000 * 60)) 
     let detikk = Math.floor( lebih % (1000 * 60) / 1000) 
let fot = `𝙽𝚘𝚝𝚎 𝙹𝚒𝚔𝚊 𝙼𝚎𝚗𝚎𝚖𝚞𝚔𝚊𝚗 𝙵𝚒𝚝𝚞𝚛 𝙴𝚛𝚘𝚛/𝙼𝚎𝚗𝚎𝚖𝚞𝚔𝚊𝚗 𝙱𝚞𝚐 
𝚂𝚒𝚕𝚊𝚑𝚔𝚊𝚗 𝙻𝚊𝚙𝚘𝚛 𝙺𝚎 𝙾𝚠𝚗𝚎𝚛 𝚂𝚒𝚕𝚊𝚑𝚔𝚊𝚗 𝙺𝚎𝚝𝚒𝚔 #𝚁𝚎𝚙𝚘𝚛𝚝
`
const listMessage = {
footer: fot,
text: 'Made By FrrlDfniX7 Offc',
mentions: await conn.parseMention(jarot),
title: FrrlDfniX7,
buttonText: `CLICK HERE ⎙`, 
sections
}
if (teks == '404') {
return conn.sendMessage(m.chat, listMessage, { quoted: fkontak, mentions: await conn.parseMention(jarot), contextInfo:{ forwardingScore: 99999, isForwarded: true }}) 
}     
    let groups = {}
    for (let tag in tags) {
      groups[tag] = []
      for (let plugin of help)
        if (plugin.tags && plugin.tags.includes(tag))
          if (plugin.help) groups[tag].push(plugin)
    }
    conn.menu = conn.menu ? conn.menu : {}
    let before = conn.menu.before || defaultMenu.before
    let header = conn.menu.header || defaultMenu.header
    let body = conn.menu.body || defaultMenu.body
    let footer = conn.menu.footer || defaultMenu.footer
    let after = conn.menu.after || (conn.user.jid == global.conn.user.jid ? '' : `Dipersembahkan oleh https://wa.me/${global.conn.user.jid.split`@`[0]}`) + defaultMenu.after
    let _text = [
      before,
      ...Object.keys(tags).map(tag => {
        return header.replace(/%category/g, tags[tag]) + '\n' + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
            return menu.help.map(help => {
              return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                .replace(/%islimit/g, menu.limit ? '(Ⓛ)' : '')
                .replace(/%isPremium/g, menu.premium ? '(Ⓟ)' : '')
                .trim()
            }).join('\n')
          }),
          footer
        ].join('\n')
      }),
      after
    ].join('\n')
    text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
    let replace = {
      '%': '%',
      ucapan: global.ucapan,
      p: _p, uptime, muptime,
      me: conn.user.name,
      npmname: package.name,
      npmdesc: package.description,
      version: package.version,
      exp: exp - min,
      maxexp: xp,
      totalexp: exp,
      xp4levelup: max - exp <= 0 ? `Siap untuk *${_p}levelup*` : `${max - exp} XP lagi untuk levelup`,
      github: package.homepage ? package.homepage.url || package.homepage : '[unknown github url]',
      level, limit, name, umur, money, age, weton, week, date, dateIslamic, time, totalreg, rtotalreg, role,
      readmore: readMore
    }
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
 //FAKEREPLY KONTAK
 const fcon = {
	 key:
	 { fromMe: false,
	 participant: `0@s.whatsapp.net`, ...(m.chat ? 
	 { remoteJid: "status@broadcast" } : {}) },
	 message: { "contactMessage": { "title":"sri","h": `haloo`, 'jpegThumbnail': fs.readFileSync('./thumbnail.jpg')}}
	}
    //------------------ DOCUMENT
let gh = 'https://github.com/JarotOffc'
let buttonMessage= {
'document':{'url':gh},
'mimetype': 'application/pdf',
'fileName':'𝙱𝚘𝚝 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝙱𝚢 𝙵𝚛𝚛𝚕𝙳𝚏𝚗𝚒𝚇𝟽',
'fileLength':'99999999999999',
'pageCount':'999',
'contextInfo':{
'externalAdReply':{
'showAdAttribution': true, 
'mediaUrl': 'https://instagram.com/farrelauliairfealdo_',
'title': '𝙱𝙾𝚃 𝙼𝚄𝙻𝚃𝙸 𝙳𝙴𝚅𝙸𝙲𝙴 𝙱𝚈 𝙵𝚁𝚁𝙻𝙳𝙵𝙽𝙸𝚇𝟽',
'body':'',
'mediaType': 2,
'thumbnail': fs.readFileSync('./thumbnail.jpg'),
'sourceUrl': 'https://instagram.com/farrelauliairfealdo_'}},
'caption': `             *『 D A S H B O A R D』*`,
'footer': text,
'buttons':[
{'buttonId':'.owner','buttonText':{'displayText': 'Owner'},'type':1},
{'buttonId':'.donasi','buttonText':{'displayText': '𝙳𝚘𝚗𝚊𝚜𝚒'},'type':1},
{'buttonId':'.rules','buttonText':{'displayText': 'Rules Bot'},'type':1},

],
'headerType':6}
    await conn.sendMessage(m.chat,buttonMessage, { quoted:fcon})
    conn.sendFile(m.chat, './mp3/jarot.mp3', '', null, m, true, { type: "audioMessage", ptt: true, fileLength: 88738 })
  } catch (e) {
    conn.reply(m.chat, 'Maaf, menu sedang error', fcon)
    throw e
  }
}
handler.help = ['menu']
handler.tags = ['main']
handler.command = /^(menu|\?)$/i
handler.owner = false
handler.mods = false
handler.premium = false
handler.group = false
handler.private = false

handler.admin = false
handler.botAdmin = false

handler.fail = null
handler.exp = 3

module.exports = handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}
function ucapan() {
  const time = moment.tz('Asia/Jakarta').format('HH')
  res = "Selamat dinihari"
  if (time >= 4) {
    res = "Selamat pagi"
  }
  if (time > 10) {
    res = "Selamat siang"
  }
  if (time >= 15) {
    res = "Selamat sore"
  }
  if (time >= 18) {
    res = "Selamat malam"
  }
  return res
}