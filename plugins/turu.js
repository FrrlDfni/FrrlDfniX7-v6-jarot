// TAU DIRI DAN SADAR DIRI YA NGAB
// ANDA MAU RUBAH
// KALAU BAIK HATI JANGAN DI HAPUS SEMUA
// TAMBAHIN AJA NAMA LU YGY
// TAU DIRI AND SADAR DIRI MAKA DI SAYANG TUHAN

const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require('@adiwajshing/baileys')
let fs = require('fs')
let fetch = require('node-fetch')
let handler = async (m, { conn }) => {
let media = global.media
  let jarot = `𝙁𝙞𝙧𝙨𝙩 𝙏𝙝𝙖𝙣𝙠𝙨 = 𝙅𝙖𝙧𝙤𝙩 𝙊𝙛𝙛𝙘
𝙉𝙊𝙏𝙀 : 𝙏𝙚𝙡𝙖𝙝 𝙈𝙚𝙣𝙜𝙚𝙢𝙗𝙖𝙣𝙜𝙠𝙖𝙣 𝘽𝙤𝙩 𝙄𝙣𝙞
  
𝙏𝙬𝙤 𝙏𝙝𝙖𝙣𝙠𝙨 = 𝙒𝙝𝙖𝙩𝙨𝘼𝙖𝙥 𝙊𝙛𝙛𝙘
𝙉𝙊𝙏𝙀 : 𝙏𝙚𝙡𝙖𝙝 𝙉𝙜𝙚𝙗𝙖𝙣𝙣𝙚𝙙 𝙉𝙤𝙢𝙚𝙧 𝘽𝙤𝙩`
  
let ofc = ` 𝙏𝙝𝙖𝙣𝙠𝙨 𝘾𝙧𝙚𝙖𝙩𝙤𝙧

⤿ 𝙁𝙧𝙧𝙡𝘿𝙛𝙣𝙞𝙓7 ( 𝙢𝙚 )

⤿ 𝙅𝙖𝙧𝙤𝙩 𝙊𝙛𝙛𝙘

⤿ 𝙎𝙤𝙗𝙧𝙞𝙣𝙤

⤿ 𝙕𝙞𝙫𝙁𝙪𝙧
    
⤿ 𝙆𝙧𝙞𝙯𝙮𝙣 𝙊𝙛𝙘

⤿ 𝙈𝙪𝙧𝙨𝙞𝙙
  
𝙏𝙝𝙖𝙣𝙠𝙨 𝙋𝙖𝙧𝙖 𝘿𝙤𝙣𝙖𝙨𝙞 𝙔𝙖𝙣𝙜 𝙏𝙚𝙧𝙝𝙤𝙧𝙢𝙖𝙩`

  const _0x7ec76f=_0x4455;function _0x3950(){const _0x35d925=['sendMessage','.owner','2868624kRTxvO','Owner','.donasi','3979456IlGFgT','instagram','ddocx','3446iOeqcT','4166658JVFxTU','12188900QVPaAG','10588rZHVKy','618opPnWt','229cQGZcg','buffer','chat','915690BDGPqs','7eXTABA'];_0x3950=function(){return _0x35d925;};return _0x3950();}(function(_0x12924a,_0xa7ae95){const _0xe961af=_0x4455,_0x45f782=_0x12924a();while(!![]){try{const _0x18bdb0=parseInt(_0xe961af(0x199))/0x1*(parseInt(_0xe961af(0x194))/0x2)+-parseInt(_0xe961af(0x198))/0x3*(parseInt(_0xe961af(0x197))/0x4)+-parseInt(_0xe961af(0x19c))/0x5+parseInt(_0xe961af(0x195))/0x6*(-parseInt(_0xe961af(0x19d))/0x7)+parseInt(_0xe961af(0x1a3))/0x8+-parseInt(_0xe961af(0x1a0))/0x9+parseInt(_0xe961af(0x196))/0xa;if(_0x18bdb0===_0xa7ae95)break;else _0x45f782['push'](_0x45f782['shift']());}catch(_0x2b797b){_0x45f782['push'](_0x45f782['shift']());}}}(_0x3950,0x5a28a));const buttonMessage={'document':{'url':sgc},'mimetype':global[_0x7ec76f(0x193)],'fileName':'SPECIAL\x20THANKS','fileLength':fsizedoc,'pageCount':fpagedoc,'contextInfo':{'forwardingScore':0x22b,'isForwarded':![],'externalAdReply':{'showAdAttribution':!![],'mediaUrl':global[_0x7ec76f(0x192)],'mediaType':0x2,'previewType':'pdf','title':wm,'body':wm,'thumbnail':await(await fetch(media))[_0x7ec76f(0x19a)](),'sourceUrl':sgc}},'caption':jarot,'footer':ofc,'buttons':[{'buttonId':_0x7ec76f(0x1a2),'buttonText':{'displayText':'Donasi'},'type':0x1},{'buttonId':_0x7ec76f(0x19f),'buttonText':{'displayText':_0x7ec76f(0x1a1)},'type':0x1}],'headerType':0x6};function _0x4455(_0x341094,_0x1ded62){const _0x395056=_0x3950();return _0x4455=function(_0x445564,_0x4efc81){_0x445564=_0x445564-0x192;let _0x37cf33=_0x395056[_0x445564];return _0x37cf33;},_0x4455(_0x341094,_0x1ded62);}await conn[_0x7ec76f(0x19e)](m[_0x7ec76f(0x19b)],buttonMessage,{'quoted':m});
}
handler.help = ['tqto']
handler.tags = ['info']
handler.command = /^(tqto|team)$/i

module.exports = handler
