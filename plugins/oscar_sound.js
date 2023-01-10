let fs = require('fs')
let handler = async (m) => {
conn.sendFile(m.chat, 'https://k.top4top.io/m_2538plh010.mp3', '', '', m, true)
}

handler.customPrefix = /^(bot)$/i
handler.command = new RegExp

handler.limit = true
handler.mods = false 
handler.premium = false
handler.group = false 
handler.private = false

module.exports = handler
