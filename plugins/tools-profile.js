let PhoneNumber = require('awesome-phonenumber')
let levelling = require('../lib/levelling')
let handler = async (m, { conn }) => {
  let pp = './src/avatar_contact.png'
  let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
  try {
    pp = await conn.profilePictureUrl(who, 'image')
  } catch (e) {
    console.log(e)
  } finally {
    let about = (await conn.fetchStatus(who).catch(console.error) || {}).status || ''
    let { name, limit, exp, lastclaim, registered, regTime, age, level } = global.db.data.users[who]
    let { min, xp, max } = levelling.xpRange(level, global.multiplier)
    let username = await(conn.getName(who)) 
    
    let str = `
Name: ${username} ${registered ? '(' + name + ') ': ''}(@${who.replace(/@.+/, '')})${about ? '\nAbout: ' + about.status : ''}
Number: ${PhoneNumber('+' + who.replace('@s.whatsapp.net', '')).getNumber('international')}
Link: https://wa.me/${who.split`@`[0]}${registered ? '\nAge: ' + age : ''}
XP: TOTAL ${exp} (${exp - min} / ${xp}) [${max - exp} left to levelup]
Level: ${level}
Limit: ${limit}
Registered: ${registered ? 'Yes (' + new Date(regTime) + ')': 'No'}${lastclaim > 0 ? '\nLast Claim: ' + new Date(lastclaim) : ''}
`.trim()
    let mentionedJid = [who]
    conn.sendMessage(m.chat, { caption: str, image: { url: pp, fileName: 'pp.jpg'}, mentions: mentionedJid}, { quoted: m})
  }
}
handler.help = ['profile [@user]']
handler.tags = ['tools']
handler.command = /^profile$/i
module.exports = handler

