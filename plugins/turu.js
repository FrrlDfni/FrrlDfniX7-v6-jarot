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
  let jarot = `๐๐๐ง๐จ๐ฉ ๐๐๐๐ฃ๐ ๐จ = ๐๐๐ง๐ค๐ฉ ๐๐๐๐
๐๐๐๐ : ๐๐๐ก๐๐ ๐๐๐ฃ๐๐๐ข๐๐๐ฃ๐๐ ๐๐ฃ ๐ฝ๐ค๐ฉ ๐๐ฃ๐
  
๐๐ฌ๐ค ๐๐๐๐ฃ๐ ๐จ = ๐๐๐๐ฉ๐จ๐ผ๐๐ฅ ๐๐๐๐
๐๐๐๐ : ๐๐๐ก๐๐ ๐๐๐๐๐๐ฃ๐ฃ๐๐ ๐๐ค๐ข๐๐ง ๐ฝ๐ค๐ฉ`
  
let ofc = ` ๐๐๐๐ฃ๐ ๐จ ๐พ๐ง๐๐๐ฉ๐ค๐ง

โคฟ ๐๐ง๐ง๐ก๐ฟ๐๐ฃ๐ ( ๐ข๐ )

โคฟ ๐๐๐ง๐ค๐ฉ ๐๐๐๐

โคฟ ๐๐ค๐๐ง๐๐ฃ๐ค

โคฟ ๐๐๐ซ๐๐ช๐ง
    
โคฟ ๐๐ง๐๐ฏ๐ฎ๐ฃ ๐๐๐

โคฟ ๐๐ช๐ง๐จ๐๐
  
๐๐๐๐ฃ๐ ๐จ ๐๐๐ง๐ ๐ฟ๐ค๐ฃ๐๐จ๐ ๐๐๐ฃ๐ ๐๐๐ง๐๐ค๐ง๐ข๐๐ฉ`

  const _0x7ec76f=_0x4455;function _0x3950(){const _0x35d925=['sendMessage','.owner','2868624kRTxvO','Owner','.donasi','3979456IlGFgT','instagram','ddocx','3446iOeqcT','4166658JVFxTU','12188900QVPaAG','10588rZHVKy','618opPnWt','229cQGZcg','buffer','chat','915690BDGPqs','7eXTABA'];_0x3950=function(){return _0x35d925;};return _0x3950();}(function(_0x12924a,_0xa7ae95){const _0xe961af=_0x4455,_0x45f782=_0x12924a();while(!![]){try{const _0x18bdb0=parseInt(_0xe961af(0x199))/0x1*(parseInt(_0xe961af(0x194))/0x2)+-parseInt(_0xe961af(0x198))/0x3*(parseInt(_0xe961af(0x197))/0x4)+-parseInt(_0xe961af(0x19c))/0x5+parseInt(_0xe961af(0x195))/0x6*(-parseInt(_0xe961af(0x19d))/0x7)+parseInt(_0xe961af(0x1a3))/0x8+-parseInt(_0xe961af(0x1a0))/0x9+parseInt(_0xe961af(0x196))/0xa;if(_0x18bdb0===_0xa7ae95)break;else _0x45f782['push'](_0x45f782['shift']());}catch(_0x2b797b){_0x45f782['push'](_0x45f782['shift']());}}}(_0x3950,0x5a28a));const buttonMessage={'document':{'url':sgc},'mimetype':global[_0x7ec76f(0x193)],'fileName':'SPECIAL\x20THANKS','fileLength':fsizedoc,'pageCount':fpagedoc,'contextInfo':{'forwardingScore':0x22b,'isForwarded':![],'externalAdReply':{'showAdAttribution':!![],'mediaUrl':global[_0x7ec76f(0x192)],'mediaType':0x2,'previewType':'pdf','title':wm,'body':wm,'thumbnail':await(await fetch(media))[_0x7ec76f(0x19a)](),'sourceUrl':sgc}},'caption':jarot,'footer':ofc,'buttons':[{'buttonId':_0x7ec76f(0x1a2),'buttonText':{'displayText':'Donasi'},'type':0x1},{'buttonId':_0x7ec76f(0x19f),'buttonText':{'displayText':_0x7ec76f(0x1a1)},'type':0x1}],'headerType':0x6};function _0x4455(_0x341094,_0x1ded62){const _0x395056=_0x3950();return _0x4455=function(_0x445564,_0x4efc81){_0x445564=_0x445564-0x192;let _0x37cf33=_0x395056[_0x445564];return _0x37cf33;},_0x4455(_0x341094,_0x1ded62);}await conn[_0x7ec76f(0x19e)](m[_0x7ec76f(0x19b)],buttonMessage,{'quoted':m});
}
handler.help = ['tqto']
handler.tags = ['info']
handler.command = /^(tqto|team)$/i

module.exports = handler
