const {
    default: makeWASocket,
    proto,
    downloadContentFromMessage,
    getBinaryNodeChild,
    jidDecode,
    areJidsSameUser,
    generateForwardMessageContent,
    generateWAMessageFromContent, 
    sha256, 
    aesDecryptWithIV, 
    Mimetype, 
    MessageType, 
    getHttpStream, 
    toBuffer, 
    extractImageThumb
} = require('@adiwajshing/baileys')
const { toAudio, toPTT, toVideo } = require('./converter')
const chalk = require('chalk')
const fetch = require('node-fetch')
const FileType = require('file-type')
const PhoneNumber = require('awesome-phonenumber')
const fs = require('fs')
const path = require('path')

exports.makeWASocket = (...args) => {
    const conn = makeWASocket(...args)
    const event = conn.ev
    
    conn.urlToBuffer = async function urlToBuffer(url) {
    	//console.log(url)
    	//if(url.startsWith('https://') === false || url.startsWith('http://') === false) url = 'https://'+url
        let stream = await getHttpStream(url)
        let extract = await extractImageThumb(stream)
        let result = extract.toString('base64') 
        return result
    }

          // conn.ws.on('CB:stream:error', (stream) => {
    //     const { code } = stream || {}
    //     if (code == '401') conn.ev.emit('connection.update', {
    //         connection: 'logged Out',
    //         lastDisconnect: {
    //             error: {
    //                 output: {
    //                     statusCode: DisconnectReason.loggedOut
    //                 }
    //             },
    //             date: new Date()
    //         }
    //     })
    // })
    conn.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }
    if (conn.user && conn.user.id) conn.user.jid = conn.decodeJid(conn.user.id)
    if (!conn.chats) conn.chats = {}

    function updateNameToDb(contacts) {
        if (!contacts) return
        for (const contact of contacts) {
            const id = conn.decodeJid(contact.id)
            if (!id) continue
            let chats = conn.chats[id]
            if (!chats) chats = conn.chats[id] = { id }
            conn.chats[id] = {
                ...chats,
                ...({
                    ...contact, id, ...(id.endsWith('@g.us') ?
                        { subject: contact.subject || chats.subject || '' } :
                        { name: contact.notify || chats.name || chats.notify || '' })
                } || {})
            }
        }
    }
	
	
    conn.ev.on('contacts.upsert', updateNameToDb)
    conn.ev.on('groups.update', updateNameToDb)
    conn.ev.on('chats.set', async ({ chats }) => {
        for (const { id, name, readOnly } of chats) {
            id = conn.decodeJid(id)
            if (!id) continue
            const isGroup = id.endsWith('@g.us')
            let chats = conn.chats[id]
            if (!chats) chats = conn.chats[id] = { id }
            chats.isChats = !readOnly
            if (name) chats[isGroup ? 'subject' : 'name'] = name
            if (isGroup) {
                const metadata = await conn.groupMetadata(id).catch(_ => null)
                if (!metadata) continue
                chats.subject = name || metadata.subject
                chats.metadata = metadata
            }
        }
    })
    conn.ev.on('group-participants.update', async function updateParticipantsToDb({ id, participants, action }) {
        id = conn.decodeJid(id)
        if (!(id in conn.chats)) conn.chats[id] = { id }
        conn.chats[id].isChats = true
        const groupMetadata = await conn.groupMetadata(id).catch(_ => null)
        if (!groupMetadata) return
        conn.chats[id] = {
            ...conn.chats[id],
            subject: groupMetadata.subject,
            metadata: groupMetadata
        }
    })

    conn.ev.on('groups.update', async function groupUpdatePushToDb(groupsUpdates) {
        for (const update of groupsUpdates) {
            const id = conn.decodeJid(update.id)
            if (!id) continue
            const isGroup = id.endsWith('@g.us')
            if (!isGroup) continue
            let chats = conn.chats[id]
            if (!chats) chats = conn.chats[id] = { id }
            chats.isChats = true
            const metadata = await conn.groupMetadata(id).catch(_ => null)
            if (!metadata) continue
            chats.subject = metadata.subject
            chats.metadata = metadata
        }
    })
    conn.ev.on('chats.upsert', async function chatsUpsertPushToDb(chatsUpsert) {
        console.log({ chatsUpsert })
        const { id, name } = chatsUpsert
        if (!id) return
        let chats = conn.chats[id] = { ...conn.chats[id], ...chatsUpsert, isChats: true }
        const isGroup = id.endsWith('@g.us')
        if (isGroup) {
            const metadata = await conn.groupMetadata(id).catch(_ => null)
            if (metadata) {
                chats.subject = name || metadata.subject
                chats.metadata = metadata
            }
            const groups = await conn.groupFetchAllParticipating().catch(_ => ({})) || {}
            for (const group in groups) conn.chats[group] = { id: group, subject: groups[group].subject, isChats: true, metadata: groups[group] }
        }
    })
    conn.ev.on('presence.update', async function presenceUpdatePushToDb({ id, presences }) {
        const sender = Object.keys(presences)[0] || id
        const _sender = conn.decodeJid(sender)
        const presence = presences[sender]['lastKnownPresence'] || 'composing'
        let chats = conn.chats[_sender]
        if (!chats) chats = conn.chats[_sender] = { id: sender }
        chats.presences = presence
        if (id.endsWith('@g.us')) {
            let chats = conn.chats[id]
            if (!chats) {
                const metadata = await conn.groupMetadata(id).catch(_ => null)
                if (metadata) chats = conn.chats[id] = { id, subject: metadata.subject, metadata }
            }
            chats.isChats = true
        }
    })


    conn.logger = {
        ...conn.logger,
        info(...args) { console.log(chalk.bold.rgb(57, 183, 16)(`INFO [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.cyan(...args)) },
        error(...args) { console.log(chalk.bold.rgb(247, 38, 33)(`ERROR [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.rgb(255, 38, 0)(...args)) },
        warn(...args) { console.log(chalk.bold.rgb(239, 225, 3)(`WARNING [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.keyword('orange')(...args)) }
    }

    /**
     * getBuffer hehe
     * @param {String|Buffer} path
     * @param {Boolean} returnFilename
     */
    conn.getFile = async (PATH, returnAsFilename) => {
        let res, filename
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        if (data && returnAsFilename && !filename) (filename = path.join(__dirname, '../tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
        return {
            res,
            filename,
            ...type,
            data
        }
    }

    /**
     * waitEvent
     * @param {*} eventName 
     * @param {Boolean} is 
     * @param {Number} maxTries 
     * @returns 
     */
    conn.waitEvent = (eventName, is = () => true, maxTries = 25) => {
        return new Promise((resolve, reject) => {
            let tries = 0
            let on = (...args) => {
                if (++tries > maxTries) reject('Max tries reached')
                else if (is()) {
                    conn.ev.off(eventName, on)
                    resolve(...args)
                }
            }
            conn.ev.on(eventName, on)
        })
    }
    
  conn.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    
   /**
    * Send Media/File with Automatic Type Specifier
    * @param {String} jid
    * @param {String|Buffer} path
    * @param {String} filename
    * @param {String} caption
    * @param {proto.WebMessageInfo} quoted
    * @param {Boolean} ptt
    * @param {Object} options
    */
    conn.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        let type = await conn.getFile(path, true)
        let { res, data: file, filename: pathFile } = type
        if (res && res.status !== 200 || file.length <= 65536) {
            try { throw { json: JSON.parse(file.toString()) } }
            catch (e) { if (e.json) throw e.json }
        }
        let opt = { filename }
        if (quoted) opt.quoted = quoted
        if (!type) options.asDocument = true
        let mtype = '', mimetype = type.mime, convert
        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
        else if (/video/.test(type.mime)) mtype = 'video'
        else if (/audio/.test(type.mime)) (
            convert = await (ptt ? toPTT : toAudio)(file, type.ext),
            file = convert.data,
            pathFile = convert.filename,
            mtype = 'audio',
            mimetype = 'audio/ogg; codecs=opus'
        )
        else mtype = 'document'
        if (options.asDocument) mtype = 'document'

        delete options.asSticker
        delete options.asLocation
        delete options.asVideo
        delete options.asDocument
        delete options.asImage

        let message = {
            ...options,
            caption,
            ptt,
            [mtype]: { url: pathFile },
            mimetype
        }
        let m
        try {
            m = await conn.sendMessage(jid, message, { ...opt, ...options })
        } catch (e) {
            console.error(e)
            m = null
        } finally {
            if (!m) m = await conn.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
            return m
        }
    }

    /**
     * Send Contact
     * @param {String} jid 
     * @param {String} number 
     * @param {String} name 
     * @param {Object} quoted 
     * @param {Object} options 
     */
    conn.sendContact = async (jid, number, name, quoted, options) => {
        number = number.replace(/[^0-9]/g, '')
        let njid = number + '@s.whatsapp.net'
        let vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${name.replace(/\n/g, '\\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}
END:VCARD
    `
        return await conn.sendMessage(jid, {
            contacts: {
                displayName: name,
                contacts: [{ vcard }],
                quoted, ...options
            },
            quoted, ...options
        })
    }

    /**
     * Reply to a message
     * @param {String} jid
     * @param {String|Object} text
     * @param {Object} quoted
     * @param {Object} options
     */
    conn.reply = (jid, text = '', quoted, options) => {
    	//let mention = (typeof options.contextInfo === 'object') ?  options.contextInfo.mentionedJid : []
        //options.mentions = mention
        //let opt = (options.mentions === 'object') ? options.mentions : []
        return Buffer.isBuffer(text) ? this.sendFile(jid, text, 'file', '', quoted, false, options) : conn.sendMessage(jid, { ...options, text }, { quoted, ...options })
    }

   /**
   * getBuffer hehe
   * @param {String|Buffer} path
   * @param {Boolean} returnFilename
   */
  conn.getFile = async (PATH, returnAsFilename) => {
    let res, filename;
    let data = Buffer.isBuffer(PATH)
      ? PATH
      : /^data:.*?\/.*?;base64,/i.test(PATH)
      ? Buffer.from(PATH.split`,`[1], "base64")
      : /^https?:\/\//.test(PATH)
      ? await (res = await fetch(PATH)).buffer()
      : fs.existsSync(PATH)
      ? ((filename = PATH), fs.readFileSync(PATH))
      : typeof PATH === "string"
      ? PATH
      : Buffer.alloc(0);
    if (!Buffer.isBuffer(data)) throw new TypeError("Result is not a buffer");
    let type = (await FileType.fromBuffer(data)) || {
      mime: "application/octet-stream",
      ext: ".bin",
    };
    if (data && returnAsFilename && !filename)
      (filename = path.join(
        __dirname,
        "../tmp/" + new Date() * 1 + "." + type.ext
      )),
        await fs.promises.writeFile(filename, data);
    return {
      res,
      filename,
      ...type,
      data,
    };
  };

  conn.resize = async (buffer, ukur1, ukur2) => {
    return new Promise(async (resolve, reject) => {
      var baper = await Jimp.read(buffer);
      var ab = await baper.resize(ukur1, ukur2).getBufferAsync(Jimp.MIME_JPEG);
      resolve(ab);
    });
  };

  conn.generateProfilePicture = async (buffer) => {
    const jimp_1 = await Jimp.read(buffer);
    const resz =
      jimp_1.getWidth() > jimp_1.getHeight()
        ? jimp_1.resize(550, Jimp.AUTO)
        : jimp_1.resize(Jimp.AUTO, 650);
    const jimp_2 = await Jimp.read(await resz.getBufferAsync(Jimp.MIME_JPEG));
    return {
      img: await resz.getBufferAsync(Jimp.MIME_JPEG),
    };
  };

    /**
     * waitEvent
     * @param {*} eventName 
     * @param {Boolean} is 
     * @param {Number} maxTries 
     * @returns 
     */
    conn.waitEvent = (eventName, is = () => true, maxTries = 25) => {
        return new Promise((resolve, reject) => {
            let tries = 0
            let on = (...args) => {
                if (++tries > maxTries) reject('Max tries reached')
                else if (is()) {
                    conn.ev.off(eventName, on)
                    resolve(...args)
                }
            }
            conn.ev.on(eventName, on)
        })
    }
    
  conn.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    
    /**
    * Send Media/File with Automatic Type Specifier
    * @param {String} jid
    * @param {String|Buffer} path
    * @param {String} filename
    * @param {String} caption
    * @param {Object} quoted
    * @param {Boolean} ptt
    * @param {Object} options
    */
    conn.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        let type = await conn.getFile(path, true)
        let { res, data: file, filename: pathFile } = type
        if (res && res.status !== 200 || file.length <= 65536) {
            try { throw { json: JSON.parse(file.toString()) } }
            catch (e) { if (e.json) throw e.json }
        }
        let opt = { filename }
        if (quoted) opt.quoted = quoted
        if (!type) if (options.asDocument) options.asDocument = true
        let mtype = '', mimetype = type.mime
        if (/webp/.test(type.mime)) mtype = 'sticker'
        else if (/image/.test(type.mime)) mtype = 'image'
        else if (/video/.test(type.mime)) mtype = 'video'
        else if (/audio/.test(type.mime)) (
            convert = await (ptt ? toPTT : toAudio)(file, type.ext),
            file = convert.data,
            pathFile = convert.filename,
            mtype = 'audio',
            mimetype = 'audio/ogg; codecs=opus'
        )
        else mtype = 'document'
        return await conn.sendMessage(jid, {
            ...options,
            caption,
            ptt,
            [mtype]: { url: pathFile },
            mimetype
        }, {
            ...opt,
            ...options
        })
    }

    /**
     * Send Contact
     * @param {String} jid 
     * @param {String} number 
     * @param {String} name 
     * @param {Object} quoted 
     * @param {Object} options 
     */
    conn.sendContact = async (jid, number, name, quoted, options) => {
        number = number.replace(/[^0-9]/g, '')
        let njid = number + '@s.whatsapp.net'
        let vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${name.replace(/\n/g, '\\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}
END:VCARD
    `
        return await conn.sendMessage(jid, {
            contacts: {
                displayName: name,
                contacts: [{ vcard }],
                quoted, ...options
            },
            quoted, ...options
        })
    }

    /**
     * Reply to a message
     * @param {String} jid
     * @param {String|Object} text
     * @param {Object} quoted
     * @param {Object} options
     */
    conn.reply = (jid, text = '', quoted, options) => {
    	//let mention = (typeof options.contextInfo === 'object') ?  options.contextInfo.mentionedJid : []
        //options.mentions = mention
        //let opt = (options.mentions === 'object') ? options.mentions : []
        return Buffer.isBuffer(text) ? this.sendFile(jid, text, 'file', '', quoted, false, options) : conn.sendMessage(jid, { ...options, text }, { quoted, ...options })
    }
     /**
   * Send a list message
   * @param jid the id to send to
   * @param button the optional button text, title and description button
   * @param rows the rows of sections list message
   */
  conn.sendListM = async (jid, button, rows, quoted, options = {}) => {
    const sections = [
      {
        title: button.title,
        rows: [...rows],
      },
    ];
    const list2Message = {
      text: button.description,
      footer: button.footerText,
      mentions: await conn.parseMention(button.description),
      ephemeralExpiration: 86400,
      title: "",
      buttonText: button.buttonText,
      sections,
    };
    conn.sendMessage(jid, list2Message, {
      quoted,
      ephemeralExpiration: 86400,
      contextInfo: {
        forwardingScore: 999999,
        isForwarded: true,
        mentions: await conn.parseMention(
          button.description + button.footerText
        ),
        ...options,
      },
    });
  };
    /**
     * send Button
     * @param {String} jid 
     * @param {String} contentText 
     * @param {String} footer
     * @param {Buffer|String} buffer 
     * @param {String[]} buttons 
     * @param {Object} quoted 
     * @param {Object} options 
     */
     
     conn.sendButtonImg = async (jid, buffer, contentText, footerText, button1, id1, quoted, options) => {
        let type = await conn.getFile(buffer)
        let { res, data: file } = type
        if (res && res.status !== 200 || file.length <= 65536) {
        try { throw { json: JSON.parse(file.toString()) } }
        catch (e) { if (e.json) throw e.json }
        }
        const buttons = [
        { buttonId: id1, buttonText: { displayText: button1 }, type: 1 }
        ]

        const buttonMessage = {
            image: file,
            fileLength: 800000000000000,
            caption: contentText,
            footer: footerText,
            mentions: await conn.parseMention(contentText + footerText),
            ...options,
            buttons: buttons,
            headerType: 4
        }

        return await conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, contextInfo: { mentionedJid: conn.parseMention(contentText + footerText) }, ...options })
    }
    conn.send2ButtonImg = async (jid, buffer, contentText, footerText, button1, id1, button2, id2, quoted, options) => {
        let type = await conn.getFile(buffer)
        let { res, data: file } = type
        if (res && res.status !== 200 || file.length <= 65536) {
        try { throw { json: JSON.parse(file.toString()) } }
        catch (e) { if (e.json) throw e.json }
        }
        const buttons = [
        { buttonId: id1, buttonText: { displayText: button1 }, type: 1 },
        { buttonId: id2, buttonText: { displayText: button2 }, type: 1 }
        ]

        const buttonMessage = {
            image: file,
            fileLength: 800000000000000,
            caption: contentText,
            footer: footerText,
            mentions: await conn.parseMention(contentText + footerText),
            ...options,
            buttons: buttons,
            headerType: 4
        }

        return await conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, contextInfo: { mentionedJid: conn.parseMention(contentText + footerText) }, ...options })
    }
    conn.send3ButtonImg = async (jid, buffer, contentText, footerText, button1, id1, button2, id2, button3, id3, quoted, options) => {
        let type = await conn.getFile(buffer)
        let { res, data: file } = type
        if (res && res.status !== 200 || file.length <= 65536) {
        try { throw { json: JSON.parse(file.toString()) } }
        catch (e) { if (e.json) throw e.json }
        }
        const buttons = [
        { buttonId: id1, buttonText: { displayText: button1 }, type: 1 },
        { buttonId: id2, buttonText: { displayText: button2 }, type: 1 },
        { buttonId: id3, buttonText: { displayText: button3 }, type: 1 }
        ]

        const buttonMessage = {
            image: file,
            fileLength: 800000000000000,
            caption: contentText,
            footer: footerText,
            mentions: await conn.parseMention(contentText + footerText),
            ...options,
            buttons: buttons,
            headerType: 4
        }

        return await conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, contextInfo: { mentionedJid: conn.parseMention(contentText + footerText) }, ...options })
    }
  
    // const { generateWAMessageFromContent, proto } = require('@adiwajshing/baileys-md')
    // const template = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
    //     templateMessage: {
    //         hydratedTemplate: {
    //             hydratedContentText: 'Testing',
    //             hydratedButtons: [{
    //                 urlButton: {
    //                     displayText: 'test',
    //                     url: 'whatsapp://send?text=HI'
    //                 }
    //             }, {
    //                 callButton: {
    //                     displayText: 'call ...',
    //                     phoneNumber: '+62 8733'
    //                 }
    //             },
    //             {
    //                 quickReplyButton: {

    //                     displayText: 'Hii',
    //                     id: 'id1'
    //                 }
    //             }
    //             ]
    //         }
    //     }
    // }), { userJid: m.sender, quoted: m });
    // return await conn.relayMessage(
    //     m.chat,
    //     template.message,
    //     { messageId: template.key.id }
    // )
    // templateMessage: {
    //     hydratedTemplate: {
    //       hydratedContentText: text.trim(),
    //       hydratedButtons: [{
    //         urlButton: {
    //           displayText: 'RestApi',
    //           url: 'https://api.dhamzxploit.my.id'
    //         }

    //       },
    //           {
    //         callButton: {
    //           displayText: 'Call Me',
    //           phoneNumber: '+6285294959195'
    //         }
    //       },
    //           {
    //         quickReplyButton: {
    //           displayText: 'BUTTON 1 ',
    //           id: '.ping'
    //         }

    //       },
    //           {
    //         quickReplyButton: {
    //           displayText: 'BUTTON 2',
    //           id: '.ping'
    //         }

    //       },
    //           {
    //         quickReplyButton: {
    //           displayText: 'BUTTON 3',
    //           id: '.ping'
    //         }

    //       }]
    //     }
    //   }
    // }), { userJid: m.sender, quoted: m });
    // return await conn.relayMessage(
    //   m.chat,
    //   template.message,
    //   { messageId: template.key.id }
    // )
    
    /**
    * cMod
    * @param {String} jid 
    * @param {*} message 
    * @param {String} text 
    * @param {String} sender 
    * @param {*} options 
    * @returns 
    */

    conn.sendButtons = async (jid, contentText, footer, buffer, buttons, quoted, options) => {
        if (buffer) try { buffer = (await conn.getFile(buffer)).data } catch { buffer = null }
        
        let data = JSON.parse(JSON.stringify(buttons))
        const buttonList = []
        for(let i=1; i<Object.keys(buttons).length;i++){
      	  buttonList[i-1] = {buttonId: data['row['+i+']'], buttonText: {displayText: data['button['+i+']']}, type: 1}
        }
        const butt = { buttons: buttonList }
        
        let message = {
            ...options,
            ...(buffer ? { caption: contentText || '' } : { text: contentText || '' }),
            footer,
            buttons: [ butt ],
            ...(buffer ? { image: buffer } : {})
        }
        return await conn.sendMessage(jid, message, {
            quoted,
            upload: conn.waUploadToServer,
            ...options
        })
    }
    //buttons.map(btn => {
     //          return {
    //                buttonId: btn[1] || btn[0] || '',
    //               buttonText: {
    //                  displayText: btn[0] || btn[1] || ''
     //               }
     //           }
     //       })
    // const { generateWAMessageFromContent, proto } = require('@adiwajshing/baileys-md')
    // const template = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
    //     templateMessage: {
    //         hydratedTemplate: {
    //             hydratedContentText: 'Testing',
    //             hydratedButtons: [{
    //                 urlButton: {
    //                     displayText: 'test',
    //                     url: 'whatsapp://send?text=HI'
    //                 }
    //             }, {
    //                 callButton: {
    //                     displayText: 'call ...',
    //                     phoneNumber: '+62 8733'
    //                 }
    //             },
    //             {
    //                 quickReplyButton: {

    //                     displayText: 'Hii',
    //                     id: 'id1'
    //                 }
    //             }
    //             ]
    //         }
    //     }
    // }), { userJid: m.sender, quoted: m });
    // return await conn.relayMessage(
    //     m.chat,
    //     template.message,
    //     { messageId: template.key.id }
    // )
    // templateMessage: {
    //     hydratedTemplate: {
    //       hydratedContentText: text.trim(),
    //       hydratedButtons: [{
    //         urlButton: {
    //           displayText: 'RestApi',
    //           url: 'https://api.dhamzxploit.my.id'
    //         }

    //       },
    //           {
    //         callButton: {
    //           displayText: 'Call Me',
    //           phoneNumber: '+6285294959195'
    //         }
    //       },
    //           {
    //         quickReplyButton: {
    //           displayText: 'BUTTON 1 ',
    //           id: '.ping'
    //         }

    //       },
    //           {
    //         quickReplyButton: {
    //           displayText: 'BUTTON 2',
    //           id: '.ping'
    //         }

    //       },
    //           {
    //         quickReplyButton: {
    //           displayText: 'BUTTON 3',
    //           id: '.ping'
    //         }

    //       }]
    //     }
    //   }
    // }), { userJid: m.sender, quoted: m });
    // return await conn.relayMessage(
    //   m.chat,
    //   template.message,
    //   { messageId: template.key.id }
    // )

    /**
    * cMod
    * @param {String} jid 
    * @param {*} message 
    * @param {String} text 
    * @param {String} sender 
    * @param {*} options 
    * @returns 
    */
    
    conn.cMod = (jid, message, text = '', sender = conn.user.jid, options = {}) => {
        let copy = message
        let mtype = Object.keys(copy.message)[0]
        let isEphemeral = false // mtype === 'ephemeralMessage'
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
        let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
        else if (content.caption) content.caption = text || content.caption
        else if (content.text) content.text = text || content.text
        if (typeof content !== 'string') msg[mtype] = { ...content, ...options }
        if (copy.participant) sender = copy.participant = sender || copy.participant
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
        copy.key.remoteJid = jid
        copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false
        return proto.WebMessageInfo.fromObject(copy)
    }

    /**
     * Exact Copy Forward
     * @param {String} jid
     * @param {Object} message
     * @param {Boolean|Number} forwardingScore
     * @param {Object} options
     */
    conn.copyNForward = async (jid, message, forwardingScore = true, options = {}) => {
        let m = generateForwardMessageContent(message, !!forwardingScore)
        let mtype = Object.keys(m)[0]
        if (forwardingScore && typeof forwardingScore == 'number' && forwardingScore > 1) m[mtype].contextInfo.forwardingScore += forwardingScore
        m = generateWAMessageFromContent(jid, m, { ...options, userJid: conn.user.id })
        await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } })
        return m
    }
    /**
     * Download media message
     * @param {Object} m
     * @param {String} type 
     * @param {fs.PathLike|fs.promises.FileHandle} filename
     * @returns {Promise<fs.PathLike|fs.promises.FileHandle|Buffer>}
     */
    conn.downloadM = async (m, type, filename = '') => {
        if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
        const stream = await downloadContentFromMessage(m, type)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        if (filename) await fs.promises.writeFile(filename, buffer)
        return filename && fs.existsSync(filename) ? filename : buffer
    }

    /**
     * Read message
     * @param {String} jid 
     * @param {String|undefined|null} participant 
     * @param {String} messageID 
     */
    conn.chatRead = async (jid, participant, messageID) => {
        return await conn.sendReadReceipt(jid, participant, [messageID])
    }

    /**
     * Parses string into mentionedJid(s)
     * @param {String} text
     */
    conn.parseMention = (text = '') => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }
    
    /**
    * Sudo Message
    * @param {String} jid
    * @param {String} jidGroup
    * @param {String} text
    * @param {Array} {...opt}
    */
    
    conn.sudoMessage = async function(jid, jidGroup, text, {...opt}) {
    	let M = proto.WebMessageInfo
        let parti = opt.parti ? opt.parti : undefined //sender
        let teks = await proto.Message.fromObject({
        	conversation: text
        })
        let name = opt.name ? opt.name : conn.getName(opt.parti)
        let m = [{
            	key: {
        	        remoteJid: jidGroup, 
                    fromMe: opt.me,
                    id: opt.idM, 
                    participant: parti
                }, 
                pushName: name,
                message: teks
            }]
        conn.ev.emit('messages.upsert', { messages: m, type: 'notify'})
        return m
    }
    
        /**
     * Send Buttons
     * @param {String} jid
     * @param {String} content
     * @param {String} footer
     * @param {Array} list => { "row[0]": '', "button[0]": '' } <= 
     * @param {Object} quoted
     * @param {Object} options
     * @param {String} type
     * @param {Buffer|Url} url
     */
    conn.sendButton = async (jid, content, footer, list = {}, quoted, options = {}, type, url) => {
      let buffer = null
      if (url) try { buffer = (await conn.getFile(url)).data } catch { buffer = null }
      try{ let data = JSON.parse(JSON.stringify(list))
      const buttonList = []
      for(let i=0; i<(Object.keys(list).length / 2);i++){
      	buttonList[i] = {buttonId: data['row['+i+']'], buttonText: {displayText: data['button['+i+']']}, type: 1}
      }
      let buttonString = JSON.stringify(buttonList)
      if(type === 'image'){
      	conn.sendMessage(jid, {
      	  image: buffer, 
            buttons: buttonList, 
            caption: content,
            footer: footer,
            headerType: 4,
            ...options
          }, { quoted })
     } else if(type === 'location'){
      	conn.sendMessage(jid, {
      	  location: { jpegThumbnail: buffer }, 
            buttons: buttonList, 
            caption: content,
            footer: footer,
            headerType: 6,
            jpegThumbnail: buffer, 
            ...options
          }, { quoted })
     } else if(type === 'video'){
     	conn.sendMessage(jid, {
      	  video: buffer, 
            buttons: buttonList, 
            caption: content,
            footer: footer,
            headerType: 4,
            ...options
          }, { quoted })
    } else {
        conn.sendMessage(jid, {
          buttons: buttonList, 
          text: content,
          footer: footer,
          headerType: 1, 
          ...options
        }, { quoted }
   //, { quoted, ...options }
     ) } } catch (e) { console.log('Error: '+ e) }
    }
    
    /**
     * Send Button with Image
     * @param {String} jid
     * @param {String|Buffer} urls
     * @param {String} content
     * @param {String} footer
     * @param {Array} list => { "row[0]": '', "button[0]": '' } <=
     * @param {Object} quoted
     * @param {Object} options
     */
    conn.sendButtonImg = async(jid, buffer, content, footer, list = {}, quoted, options = {}) => {
      const buttonList = []
      for(let i=1; i<list.length;i++){
      	buttonList[i] = {buttonId: list.row[i], buttonText: {displayText: list.button[i]}, type: 1}
      }
      return await conn.sendMessage(jid, {
        caption: content,
        footerText: footer,
        buttons: buttonList,
        headerType: 4,
        image: buffer
      }, {
        quoted, ...options
      })
    }
    
 	 /**
     * send Button Vid
     * @param {String} jid 
     * @param {String} contentText 
     * @param {String} footer
     * @param {Buffer|String} buffer
     * @param {String} buttons1
     * @param {String} row1
     * @param {Object} quoted 
     * @param {Object} options 
     */
    conn.sendButtonVid = async (jid, buffer, contentText, footerText, button1, id1, quoted, options) => {
        let type = await conn.getFile(buffer)
        let { res, data: file } = type
        if (res && res.status !== 200 || file.length <= 65536) {
        try { throw { json: JSON.parse(file.toString()) } }
        catch (e) { if (e.json) throw e.json }
        }
        let buttons = [
        { buttonId: id1, buttonText: { displayText: button1 }, type: 1 }
        ]
        const buttonMessage = {
            video: file,
            fileLength: 887890909999999,
            caption: contentText,
            footer: footerText,
            mentions: await conn.parseMention(contentText),
            ...options,
            buttons: buttons,
            headerType: 4
        }
        return await conn.sendMessage(jid, buttonMessage, {
            quoted,
            ephemeralExpiration: 86400,
            ...options
        })
    }
    
    conn.sendGroupV4Invite = async (jid, participant, inviteCode, inviteExpiration, groupName = 'unknown subject', caption = 'Invitation to join my WhatsApp group', options = {}) => {
        let msg = proto.Message.fromObject({
            groupInviteMessage: proto.GroupInviteMessage.fromObject({
                inviteCode,
                inviteExpiration: parseInt(inviteExpiration) || + new Date(new Date + (3 * 86400000)),
                groupJid: jid,
                groupName: groupName ? groupName : this.getName(jid),
                caption
            })
        })
        let message = await this.prepareMessageFromContent(participant, msg, options)
        await this.relayWAMessage(message)
        return message
    }

    /**
   * send Button Loc
   * @param {String} jid
   * @param {String} contentText
   * @param {String} footer
   * @param {Buffer|String} buffer
   * @param {String[]} buttons
   * @param {Object} quoted
   * @param {Object} options
   */
  conn.sendButtonLoc = async (
    jid,
    buffer,
    content,
    footer,
    button1,
    row1,
    quoted,
    options = {}
  ) => {
    let type = await conn.getFile(buffer);
    let { res, data: file } = type;
    if ((res && res.status !== 100) || file.length <= 100) {
      try {
        throw { json: JSON.parse(file.toString()) };
      } catch (e) {
        if (e.json) throw e.json;
      }
    }
    let buttons = [
      { buttonId: row1, buttonText: { displayText: button1 }, type: 1 },
    ];

    let buttonMessage = {
      location: { jpegThumbnail: file },
      caption: content,
      footer: footer,
      mentions: await conn.parseMention(content + footer),
      ...options,
      buttons: buttons,
      headerType: 6,
    };
    return await conn.sendMessage(jid, buttonMessage, {
      quoted,
      upload: conn.waUploadToServer,
      ephemeralExpiration: 86400,
      mentions: await conn.parseMention(content + footer),
      ...options,
    });
  };
  conn.send2ButtonLoc = async (
    jid,
    buffer,
    content,
    footer,
    button1,
    row1,
    button2,
    row2,
    quoted,
    options = {}
  ) => {
    let type = await conn.getFile(buffer);
    let { res, data: file } = type;
    if ((res && res.status !== 50) || file.length <= 50) {
      try {
        throw { json: JSON.parse(file.toString()) };
      } catch (e) {
        if (e.json) throw e.json;
      }
    }
    let buttons = [
      { buttonId: row1, buttonText: { displayText: button1 }, type: 1 },
      { buttonId: row2, buttonText: { displayText: button2 }, type: 1 },
    ];

    let buttonMessage = {
      location: { jpegThumbnail: file },
      caption: content,
      footer: footer,
      mentions: await conn.parseMention(content + footer),
      ...options,
      buttons: buttons,
      headerType: 6,
    };
    return await conn.sendMessage(jid, buttonMessage, {
      quoted,
      upload: conn.waUploadToServer,
      ephemeralExpiration: 86400,
      mentions: await conn.parseMention(content + footer),
      ...options,
    });
  };
  conn.send3ButtonLoc = async (
    jid,
    buffer,
    content,
    footer,
    button1,
    row1,
    button2,
    row2,
    button3,
    row3,
    quoted,
    options = {}
  ) => {
    let type = await conn.getFile(buffer);
    let { res, data: file } = type;
    if ((res && res.status !== 100) || file.length <= 65536) {
      try {
        throw { json: JSON.parse(file.toString()) };
      } catch (e) {
        if (e.json) throw e.json;
      }
    }
    let buttons = [
      { buttonId: row1, buttonText: { displayText: button1 }, type: 1 },
      { buttonId: row2, buttonText: { displayText: button2 }, type: 1 },
      { buttonId: row3, buttonText: { displayText: button3 }, type: 1 },
    ];

    let buttonMessage = {
      location: { jpegThumbnail: file },
      caption: content,
      footer: footer,
      mentions: await conn.parseMention(content + footer),
      ...options,
      buttons: buttons,
      headerType: 6,
    };
    return await conn.sendMessage(jid, buttonMessage, {
      quoted,
      upload: conn.waUploadToServer,
      ephemeralExpiration: 86400,
      mentions: await conn.parseMention(content + footer),
      ...options,
    });
  };
    /**
     * send Button Document
     * @param {String} jid 
     * @param {String} contentText 
     * @param {String} footer
     * @param {Buffer|String} buffer 
     * @param {String[]} buttons 
     * @param {Object} quoted 
     * @param {Object} options 
     */
    conn.sendButtonDoc = async (jid, content, footerText, button1, id1, quoted, options) => {
      const buttons = [
        { buttonId: id1, buttonText: { displayText: button1 }, type: 1 }
      ]
      const buttonMessage = {
        document: { url: "https://wa.me/6281320170984" },
        mimetype: global.doc,
        fileName: global.ucapan,
        fileLength: 887890909999999,
        pageCount: 1234567890123456789012345,
        caption: content,
        footer: footerText,
        mentions: await conn.parseMention(content + footerText),
        ...options,
        buttons: buttons,
        headerType: 1
      }
      conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, forwardingScore: 99999, isForwarded: true, ...options })
    }
    conn.send2ButtonDoc = async (jid, content, footerText, button1, id1, button2, id2, quoted, options) => {
        const buttons = [
        { buttonId: id1, buttonText: { displayText: button1 }, type: 1 },
        { buttonId: id2, buttonText: { displayText: button2 }, type: 1 }
        ]
    const buttonMessage = {
        document: { url: "https://wa.me/6281320170984" },
        mimetype: global.doc,
        fileName: global.ucapan,
        fileLength: 887890909999999,
        pageCount: 1234567890123456789012345,
        caption: content,
        footer: footerText,
        mentions: await conn.parseMention(content + footerText),
        ...options,
        buttons: buttons,
        headerType: 1
      }
      conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, forwardingScore: 99999, isForwarded: true, ...options })
    }
    conn.send2ButtonDoc = async (jid, content, footerText, button1, id1, button2, id2, quoted, options) => {
        const buttons = [
        { buttonId: id1, buttonText: { displayText: button1 }, type: 1 },
        { buttonId: id2, buttonText: { displayText: button2 }, type: 1 }
        ]
    const buttonMessage = {
            document: { url: "https://wa.me/6281320170984"},
            mimetype: global.doc,
            fileName: global.ucapan,
            fileLength: 887890909999999,
            pageCount: 1234567890123456789012345,
            caption: content,
            footer: footerText,
            mentions: await conn.parseMention(content + footerText),
            ...options,
            buttons: buttons,
            headerType: 1
        }
        conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, contextInfo: { mentionedJid: conn.parseMention(content + footerText), forwardingScore: 99999, isForwarded: true }, ...options, ephemeralExpiration: 86400 } )
    }
    conn.send2ButtonImgDoc = async (jid, buffer, contentText, footerText, button1, id1, button2, id2, quoted, options) => {
        let type = await conn.getFile(buffer)
        let { res, data: file } = type
        if (res && res.status !== 200 || file.length <= 65536) {
        try { throw { json: JSON.parse(file.toString()) } }
        catch (e) { if (e.json) throw e.json }
        }
   const buttons = [
        { buttonId: id1, buttonText: { displayText: button1 }, type: 1 },
        { buttonId: id2, buttonText: { displayText: button2 }, type: 1 }
        ]

        const buttonMessage = {
            image: file,
            document: { url: "https://wa.me/6281320170984"},
            mimetype: global.doc,
            fileName: global.ucapan,
            fileLength: 887890909999999,
            pageCount: 1234567890123456789012345,
            fileLength: 887890909999999,
            caption: contentText,
            footer: footerText,
            mentions: await conn.parseMention(contentText + footerText),
            ...options,
            buttons: buttons,
            headerType: 4
        }

        return await conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, contextInfo: { mentionedJid: conn.parseMention(contentText + footerText) }, ...options })
    }
    
    conn.sendTemplateButtonLoc = async (jid, buffer, contentText, footer, buttons1, row1, quoted, options) => {
    const type = await conn.getFile(buffer)
        let { res, data: file } = type
        if (res && res.status !== 200 || file.length <= 65536) {
        try { throw { json: JSON.parse(file.toString()) } }
        catch (e) { if (e.json) throw e.json }
        }
    const template = generateWAMessageFromContent(jid, proto.Message.fromObject({
      templateMessage: {
        hydratedTemplate: {
          locationMessage: { jpegThumbnail: file },
          hydratedContentText: contentText,
          hydratedFooterText: footer,
          ...options,
          hydratedButtons: [{
            urlButton: {
              displayText: global.dtu,
              url: global.urlnya
            }
          },
          {
            quickReplyButton: {
              displayText: buttons1,
              id: row1
            }
          }]
        }
      }
    }), { userJid: conn.user.jid, quoted: quoted, contextInfo: { mentionedJid: conn.parseMention(contentText + footer) }, ephemeralExpiration: 86400, ...options });
    return await conn.relayMessage(
      jid,
      template.message,
      { messageId: template.key.id }
    )
	    }
   
    conn.sendH3Button = async (jid, content, displayText, link, displayCall, number, quickReplyText, id, quickReplyText2, id2, quickReplyText3, id3, quoted) => {
		let template = generateWAMessageFromContent(jid, proto.Message.fromObject({
			         templateMessage: {
             hydratedTemplate: {
                 hydratedContentText: content,
                 hydratedButtons: [{
                     urlButton: {
                         displayText: displayText,
                         url: link
                     }
                 }, {
                     callButton: {
                         displayText: displayCall,
                         phoneNumber: number
                     }
                 },
                 {
             quickReplyButton: {
               displayText: quickReplyText,
               id: id,
             }

           },
               {
             quickReplyButton: {
               displayText: quickReplyText2,
               id: id2,
             }
           },
           {
             quickReplyButton: {
              displayText: quickReplyText3,
               id: id3,
            }
		   }]
         }
       }
     }), { userJid: conn.user.jid, quoted: quoted});
     return await conn.relayMessage(
         jid,
         template.message,
         { messageId: template.key.id }
     )
	}

    /**
     * send Button
     * @param {String} jid 
     * @param {String} contentText 
     * @param {String} footer
     * @param {Buffer|String} buffer 
     * @param {String[]} buttons 
     * @param {Object} quoted 
     * @param {Object} options 
     */
    conn.sendButton = async (jid, contentText, footer, buffer, buttons, quoted, options) => {
        if (buffer) try { buffer = (await conn.getFile(buffer)).data } catch { buffer = null }
        let message = {
            ...options,
            ...(buffer ? { caption: contentText || '' } : { text: contentText || '' }),
            footer,
            buttons: buttons.map(btn => {
                return {
                    buttonId: btn[1] || btn[0] || '',
                    buttonText: {
                        displayText: btn[0] || btn[1] || ''
                    }
                }
            }),
            ...(buffer ? { image: buffer } : {})
        }
        return await conn.sendMessage(jid, message, {
            quoted,
            upload: conn.waUploadToServer,
            ...options
        })
    }
    
   conn.sendBut = async(jid, content, footer, button1, row1, quoted) => {
	  const buttons = [
	  {buttonId: row1, buttonText: {displayText: button1}, type: 1}
	  ]
const buttonMessage = {
    text: content,
    footer: footer,
    buttons: buttons,
    headerType: 1,
    mentions: conn.parseMention(footer+content)
}
return await conn.sendMessage(jid, buttonMessage, {quoted})
  }
  
   conn.send2But = async(jid, content, footer, button1, row1, button2, row2, quoted) => {
	  const buttons = [
	   { buttonId: row1, buttonText: { displayText: button1 }, type: 1 },
          { buttonId: row2, buttonText: { displayText: button2 }, type: 1 }
	  ]
const buttonMessage = {
    text: content,
    footer: footer,
    buttons: buttons,
    headerType: 1
}
return await conn.sendMessage(jid, buttonMessage, {quoted})
  }
  
   conn.send3But = async(jid, content, footer,button1, row1, button2, row2, button3, row3, quoted) => {
	  const buttons = [
	  { buttonId: row1, buttonText: { displayText: button1 }, type: 1 },
          { buttonId: row2, buttonText: { displayText: button2 }, type: 1 },
          { buttonId: row3, buttonText: { displayText: button3 }, type: 1 }
	  ]
const buttonMessage = {
    text: content,
    footer: footer,
    buttons: buttons,
    headerType: 1
}
return await conn.sendMessage(jid, buttonMessage, {quoted})
  }
  conn.send4But = async(jid, content, footer,button1, row1, button2, row2, button3, row3, button4, row4, quoted) => {
    const buttons = [
    { buttonId: row1, buttonText: { displayText: button1 }, type: 1 },
        { buttonId: row2, buttonText: { displayText: button2 }, type: 1 },
        { buttonId: row3, buttonText: { displayText: button3 }, type: 1 },
        { buttonId: row4, buttonText: { displayText: button4 }, type: 1 }
    ]
const buttonMessage = {
  text: content,
  footer: footer,
  buttons: buttons,
  headerType: 1
}
return await conn.sendMessage(jid, buttonMessage, {quoted})
}    
/**
     * Get name from jid
     * @param {String} jid
     * @param {Boolean} withoutContact
     */
    conn.getName = (jid = '', withoutContact = false) => {
        jid = conn.decodeJid(jid)
        withoutContact = this.withoutContact || withoutContact
        let v
        if (jid.endsWith('@g.us')) return new Promise(async (resolve) => {
            v = conn.chats[jid] || {}
            if (!(v.name || v.subject)) v = await conn.groupMetadata(jid) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = jid === '0@s.whatsapp.net' ? {
            jid,
            vname: 'WhatsApp'
        } : areJidsSameUser(jid, conn.user.id) ?
            conn.user :
            (conn.chats[jid] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.vname || v.notify || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    /**
     * to process MessageStubType
     * @param {proto.WebMessageInfo} m 
     */
     conn.processMessageStubType = async(m) => {
    /**
     * to process MessageStubType
     * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} m 
     */
    if (!m.messageStubType) return
        const chat = conn.decodeJid(m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || '')
    if (!chat || chat === 'status@broadcast') return
        const emitGroupUpdate = (update) => {
            conn.ev.emit('groups.update', [{ id: chat, ...update }])
        }
        switch (m.messageStubType) {
            case WAMessageStubType.REVOKE:
            case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
            emitGroupUpdate({ revoke: m.messageStubParameters[0] })
            break
            case WAMessageStubType.GROUP_CHANGE_ICON:
            emitGroupUpdate({ icon: m.messageStubParameters[0] })
            break
            default: {
                console.log({
                    messageStubType: m.messageStubType,
                    messageStubParameters: m.messageStubParameters,
                    type: WAMessageStubType[m.messageStubType]
                })
                break
            }
        }
        const isGroup = chat.endsWith('@g.us')
        if (!isGroup) return
        let chats = conn.chats[chat]
        if (!chats) chats = conn.chats[chat] = { id: chat }
        chats.isChats = true
        const metadata = await conn.groupMetadata(chat).catch(_ => null)
        if (!metadata) return
        chats.subject = metadata.subject
        chats.metadata = metadata
    }
    conn.insertAllGroup = async() => {
        const groups = await conn.groupFetchAllParticipating().catch(_ => null) || {}
        for (const group in groups) conn.chats[group] = { ...(conn.chats[group] || {}), id: group, subject: groups[group].subject, isChats: true, metadata: groups[group] }
            return conn.chats
    }
    
    /*conn.processMessageStubType = async (m) => {
        if (!m.messageStubType) return
        const mtype = Object.keys(m.message || {})[0]
        const chat = conn.decodeJid(m.key.remoteJid || m.message[mtype] && m.message[mtype].groupId || '')
        const isGroup = chat.endsWith('@g.us')
        if (!isGroup) return
        let chats = conn.chats[chat]
        if (!chats) chats = conn.chats[chat] = { id: chat }
        chats.isChats = true
        const metadata = await conn.groupMetadata(chat).catch(_ => null)
        if (!metadata) return
        chats.subject = metadata.subject
        chats.metadata = metadata
    }*/

    /**
     * pushMessage
     * @param {proto.WebMessageInfo[]} m 
     */
     conn.pushMessage = async(m) => {
    /**
     * pushMessage
     * @param {import('@adiwajshing/baileys').proto.WebMessageInfo[]} m 
     */
    if (!m) return
        if (!Array.isArray(m)) m = [m]
            for (const message of m) {
                try {
                // if (!(message instanceof proto.WebMessageInfo)) continue // https://github.com/adiwajshing/Baileys/pull/696/commits/6a2cb5a4139d8eb0a75c4c4ea7ed52adc0aec20f
                if (!message) continue
                    if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT) conn.processMessageStubType(message).catch(console.error)
                        const _mtype = Object.keys(message.message || {})
                    const mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) ||
                    (_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) ||
                    _mtype[_mtype.length - 1]
                    const chat = conn.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '')
                    if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
                    /**
                     * @type {import('@adiwajshing/baileys').proto.IContextInfo}
                     */
                    let context = message.message[mtype].contextInfo
                    let participant = conn.decodeJid(context.participant)
                    const remoteJid = conn.decodeJid(context.remoteJid || participant)
                    /**
                     * @type {import('@adiwajshing/baileys').proto.IMessage}
                     * 
                     */
                    let quoted = message.message[mtype].contextInfo.quotedMessage
                    if ((remoteJid && remoteJid !== 'status@broadcast') && quoted) {
                        let qMtype = Object.keys(quoted)[0]
                        if (qMtype == 'conversation') {
                            quoted.extendedTextMessage = { text: quoted[qMtype] }
                            delete quoted.conversation
                            qMtype = 'extendedTextMessage'
                        }

                        if (!quoted[qMtype].contextInfo) quoted[qMtype].contextInfo = {}
                        quoted[qMtype].contextInfo.mentionedJid = context.mentionedJid || quoted[qMtype].contextInfo.mentionedJid || []
                        const isGroup = remoteJid.endsWith('g.us')
                        if (isGroup && !participant) participant = remoteJid
                            const qM = {
                                key: {
                                    remoteJid,
                                    fromMe: areJidsSameUser(conn.user.jid, remoteJid),
                                    id: context.stanzaId,
                                    participant,
                                },
                                message: JSON.parse(JSON.stringify(quoted)),
                                ...(isGroup ? { participant } : {})
                            }
                            let qChats = conn.chats[participant]
                            if (!qChats) qChats = conn.chats[participant] = { id: participant, isChats: !isGroup }
                                if (!qChats.messages) qChats.messages = {}
                                    if (!qChats.messages[context.stanzaId] && !qM.key.fromMe) qChats.messages[context.stanzaId] = qM
                                        let qChatsMessages
                                        if ((qChatsMessages = Object.entries(qChats.messages)).length > 40) qChats.messages = Object.fromEntries(qChatsMessages.slice(30, qChatsMessages.length)) // maybe avoid memory leak
                                    }
                            }
                            if (!chat || chat === 'status@broadcast') continue
                                const isGroup = chat.endsWith('@g.us')
                            let chats = conn.chats[chat]
                            if (!chats) {
                                if (isGroup) await conn.insertAllGroup().catch(console.error)
                                    chats = conn.chats[chat] = { id: chat, isChats: true, ...(conn.chats[chat] || {}) }
                            }
                            let metadata, sender
                            if (isGroup) {
                                if (!chats.subject || !chats.metadata) {
                                    metadata = await conn.groupMetadata(chat).catch(_ => ({})) || {}
                                    if (!chats.subject) chats.subject = metadata.subject || ''
                                    if (!chats.metadata) chats.metadata = metadata
                                }
                            sender = conn.decodeJid(message.key?.fromMe && conn.user.id || message.participant || message.key?.participant || chat || '')
                            if (sender !== chat) {
                                let chats = conn.chats[sender]
                                if (!chats) chats = conn.chats[sender] = { id: sender }
                                if (!chats.name) chats.name = message.pushName || chats.name || ''
                            }
                    } else if (!chats.name) chats.name = message.pushName || chats.name || ''
                    if (['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype)) continue
                        chats.isChats = true
                    if (!chats.messages) chats.messages = {}
                        const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id)
                    if (!['protocolMessage'].includes(mtype) && !fromMe && message.messageStubType != WAMessageStubType.CIPHERTEXT && message.message) {
                        delete message.message.messageContextInfo
                        delete message.message.senderKeyDistributionMessage
                        chats.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2))
                        let chatsMessages
                        if ((chatsMessages = Object.entries(chats.messages)).length > 40) chats.messages = Object.fromEntries(chatsMessages.slice(30, chatsMessages.length))
                    }
            } catch (e) {
                console.error(e)
            }
        }
    }
     
    /*conn.pushMessage = async (m) => {
        if (!m) return
        if (!Array.isArray(m)) m = [m]
        for (const message of m) {
            try {
                // if (!(message instanceof proto.WebMessageInfo)) continue // https://github.com/adiwajshing/Baileys/pull/696/commits/6a2cb5a4139d8eb0a75c4c4ea7ed52adc0aec20f
                if (!message) continue
                if (message.messageStubType) conn.processMessageStubType(message).catch(console.error)
                let mtype = Object.keys(message.message || {})
                mtype = mtype[mtype[0] === 'messageContextInfo' && mtype.length == 2 ? 1 : 0]
                const chat = conn.decodeJid(message.key.remoteJid || message.message[mtype] && message.message[mtype].groupId || '')
                const isGroup = chat.endsWith('@g.us')
                let chats = conn.chats[chat]
                if (!chats) {
                    if (isGroup) {
                        const groups = await conn.groupFetchAllParticipating().catch(_ => ({}))
                        for (const group in groups) conn.chats[group] = { id: group, subject: groups[group].subject, isChats: true, metadata: groups[group] }
                    }
                    chats = conn.chats[chat] = { id: chat, ...(conn.chats[chat] || {}) }
                }
                let metadata, sender
                if (isGroup) {
                    if (!chats.subject || !chats.metadata) {
                        metadata = await conn.groupMetadata(chat).catch(_ => ({})) || {}
                        if (!chats.subject) chats.subject = metadata.subject || ''
                        if (!chats.metadata) chats.metadata = metadata
                    }
                    sender = conn.decodeJid(message.fromMe && conn.user.id || message.participant || message.key.participant || chat || '')
                    if (sender !== chat) {
                        let chats = conn.chats[sender]
                        if (!chats) chats = conn.chats[sender] = { id: sender }
                        if (!chats.name) chats.name = message.pushName || chats.name || ''
                    }
                } else {
                    if (!chats.name) chats.name = message.pushName || chats.name || ''
                }
                if (['senderKeyDistributionMessage', 'protocolMessage'].includes(mtype)) continue
                chats.isChats = true
                const fromMe = message.key.fromMe || areJidsSameUser(chat, conn.user.id)
                if (!chats.messages) chats.messages = {}
                if (!fromMe) chats.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2))
            } catch (e) {
                console.error(e)
            }
        }
    }*/
    
    /**
     * 
     * @param  {...any} args 
     * @returns 
     */
    conn.format = (...args) => {
        return util.format(...args)
    }
    
    /**
     * 
     * @param {String} url 
     * @param {Object} options 
     * @returns 
     */
    conn.getBuffer = async (url, options) => {
        try {
            options ? options : {}
            const res = await axios({
                method: "get",
                url,
                headers: {
                    'DNT': 1,
                    'Upgrade-Insecure-Request': 1
                },
                ...options,
                responseType: 'arraybuffer'
            })
            return res.data
        } catch (e) {
            console.log(`Error : ${e}`)
        }
    }

    /**
     * Serialize Message, so it easier to manipulate
     * @param {Object} m
     */
    conn.serializeM = (m) => {
        return exports.smsg(conn, m)
    }

    Object.defineProperty(conn, 'name', {
        value: 'WASocket',
        configurable: true,
    })
    return conn
}
/**
 * Serialize Message
 * @param {ReturnType<typeof makeWASocket>} conn 
 * @param {proto.WebMessageInfo} m 
 * @param {Boolean} hasParent 
 */
 exports.smsg = (conn, m, hasParent) => {
    if (!m) return m
    let M = proto.WebMessageInfo
    m = M.fromObject(m)
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id && m.id.length === 16 || m.id.startsWith('3EB0') && m.id.length === 12 || false
        m.chat = conn.decodeJid(m.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '')
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = conn.decodeJid(m.key.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '')
        m.fromMe = m.key.fromMe || areJidsSameUser(m.sender, conn.user.id)
    }
    if (m.message) {
        let mtype = Object.keys(m.message)
        m.mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype[0]) && mtype[0]) || // Sometimes message in the front
            (mtype.length >= 3 && mtype[1] !== 'messageContextInfo' && mtype[1]) || // Sometimes message in midle if mtype length is greater than or equal to 3!
            mtype[mtype.length - 1] // common case
        m.msg = m.message[m.mtype]
        if (m.chat == 'status@broadcast' && ['protocolMessage', 'senderKeyDistributionMessage'].includes(m.mtype)) m.chat = (m.key.remoteJid !== 'status@broadcast' && m.key.remoteJid) || m.sender
        if (m.mtype == 'protocolMessage' && m.msg.key) {
            if (m.msg.key.remoteJid == 'status@broadcast') m.msg.key.remoteJid = m.chat
            if (!m.msg.key.participant || m.msg.key.participant == 'status_me') m.msg.key.participant = m.sender
            m.msg.key.fromMe = conn.decodeJid(m.msg.key.participant) === conn.decodeJid(conn.user.id)
            if (!m.msg.key.fromMe && m.msg.key.remoteJid === conn.decodeJid(conn.user.id)) m.msg.key.remoteJid = m.sender
        }
        m.text = m.msg.text || m.msg.caption || m.msg.contentText || m.msg || ''
        if (typeof m.text !== 'string') {
            if ([
                'protocolMessage',
                'messageContextInfo',
                'stickerMessage',
                'audioMessage',
                'senderKeyDistributionMessage'
            ].includes(m.mtype)) m.text = ''
            else m.text = m.text.selectedDisplayText || m.text.hydratedTemplate?.hydratedContentText || m.text
        }
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid?.length && m.msg.contextInfo.mentionedJid || []
        let quoted = m.quoted = m.msg?.contextInfo?.quotedMessage ? m.msg.contextInfo.quotedMessage : null
        if (m.quoted) {
            let type = Object.keys(m.quoted)[0]
            m.quoted = m.quoted[type]
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted }
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.chat = conn.decodeJid(m.msg.contextInfo.remoteJid || m.chat || m.sender)
            m.quoted.isBaileys = m.quoted.id && m.quoted.id.length === 16 || false
            m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.sender === conn.user.jid
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.contentText || ''
            m.quoted.name = conn.getName(m.quoted.sender)
            m.quoted.mentionedJid = m.quoted.contextInfo?.mentionedJid?.length && m.quoted.contextInfo.mentionedJid || []
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    fromMe: m.quoted.fromMe,
                    remoteJid: m.quoted.chat,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            })
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return null
                let q = M.fromObject(await conn.loadMessage(m.quoted.id) || vM)
                return exports.smsg(conn, q)
            }
            if (m.quoted.url || m.quoted.directPath) m.quoted.download = (saveToFile = false) => conn.downloadM(m.quoted, m.quoted.mtype.replace(/message/i, ''), saveToFile)
            
 
/*exports.smsg = (conn, m, hasParent) => {
    if (!m) return m
    let M = proto.WebMessageInfo
    m = M.fromObject(m)
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id && m.id.length === 16 || m.id.startsWith('3EB0') && m.id.length === 12 || false
        let mtype = Object.keys(m.message || {})[0]
        m.chat = conn.decodeJid(m.key.remoteJid || m.message[mtype] && m.message[mtype].groupId || '')
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = conn.decodeJid(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '')
        m.fromMe = m.key.fromMe || areJidsSameUser(m.sender, conn.user.id)
    }
    if (m.message) {
        let mtype = Object.keys(m.message)
        m.mtype = mtype[mtype[0] === 'messageContextInfo' && mtype.length == 2 ? 1 : 0]
        m.msg = m.message[m.mtype]
        if (m.chat == 'status@broadcast' && ['protocolMessage', 'senderKeyDistributionMessage'].includes(m.mtype)) m.chat = m.sender
        // if (m.mtype === 'ephemeralMessage') {
        //     exports.smsg(conn, m.msg)
        //     m.mtype = m.msg.mtype
        //     m.msg = m.msg.msg
        //   }
        if (m.mtype == 'protocolMessage' && m.msg.key) {
            if (m.msg.key.remoteJid == 'status@broadcast') m.msg.key.remoteJid = m.chat
            if (!m.msg.key.participant || m.msg.key.participant == 'status_me') m.msg.key.participant = m.sender
            m.msg.key.fromMe = conn.decodeJid(m.msg.key.participant) === conn.decodeJid(conn.user.id)
            if (!m.msg.key.fromMe && m.msg.key.remoteJid === conn.decodeJid(conn.user.id)) m.msg.key.remoteJid = m.sender
        }
        m.text = m.msg.text || m.msg.caption || m.msg.contentText || m.msg || ''
        m.mentionedJid = m.msg && m.msg.contextInfo && m.msg.contextInfo.mentionedJid && m.msg.contextInfo.mentionedJid.length && m.msg.contextInfo.mentionedJid || []
        let quoted = m.quoted = m.msg && m.msg.contextInfo && m.msg.contextInfo.quotedMessage ? m.msg.contextInfo.quotedMessage : null
        if (m.quoted) {
            let type = Object.keys(m.quoted)[0]
            m.quoted = m.quoted[type]
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted }
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.chat = conn.decodeJid(m.msg.contextInfo.remoteJid || m.chat || m.sender)
            m.quoted.isBaileys = m.quoted.id && m.quoted.id.length === 16 || false
            m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.sender === conn.user.jid
            m.quoted.text = m.quoted.text || m.quoted.caption || ''
            m.quoted.name = conn.getName(m.quoted.sender)
            m.quoted.mentionedJid = m.quoted.contextInfo && m.quoted.contextInfo.mentionedJid && m.quoted.contextInfo.mentionedJid.length && m.quoted.contextInfo.mentionedJid || []
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    fromMe: m.quoted.fromMe,
                    remoteJid: m.quoted.chat,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            })
            m.getQuotedObj = m.getQuotedMessage = () => {
                if (!m.quoted.id) return false
                let q = M.fromObject(((conn.chats[m.quoted.chat] || {}).messages || {})[m.quoted.id])
                return exports.smsg(conn, q ? q : vM)
            }

            if (m.quoted.url || m.quoted.directPath) m.quoted.download = (saveToFile = false) => conn.downloadM(m.quoted, m.quoted.mtype.replace(/message/i, ''), saveToFile)*/

            /**
             * Reply to quoted message
             * @param {String|Object} text
             * @param {String|false} chatId
             * @param {Object} options
             */
            m.quoted.reply = (text, chatId, options) => conn.reply(chatId ? chatId : m.chat, text, vM, options)

            /**
             * Copy quoted message
             */
            m.quoted.copy = () => exports.smsg(conn, M.fromObject(M.toObject(vM)))

            /**
             * Forward quoted message
             * @param {String} jid
             *  @param {Boolean} forceForward
            */
            m.quoted.forward = (jid, forceForward = false) => conn.forwardMessage(jid, vM, forceForward)

            /**
             * Exact Forward quoted message
             * @param {String} jid
             * @param {Boolean|Number} forceForward
             * @param {Object} options
            */
            m.quoted.copyNForward = (jid, forceForward = true, options = {}) => conn.copyNForward(jid, vM, forceForward, options)

            /**
             * Modify quoted Message
             * @param {String} jid
             * @param {String} text
             * @param {String} sender
             * @param {Object} options
            */
            m.quoted.cMod = (jid, text = '', sender = m.quoted.sender, options = {}) => conn.cMod(jid, vM, text, sender, options)

            /**
             * Delete quoted message
             */
            m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key })
        }
    }
    m.name = m.pushName || conn.getName(m.sender)
    if (m.msg && m.msg.url) m.download = (saveToFile = false) => conn.downloadM(m.msg, m.mtype.replace(/message/i, ''), saveToFile)
    /**
     * Reply to this message
     * @param {String|Object} text
     * @param {String|false} chatId
     * @param {Object} options
     */
    m.reply = (text, chatId, options) => conn.reply(chatId ? chatId : m.chat, text, m, options)

    /**
     * Copy this message
     */
    m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)))

    /**
     * Forward this message
     * @param {String} jid
     * @param {Boolean} forceForward
     */
    m.forward = (jid = m.chat, forceForward = false) => conn.copyNForward(jid, m, forceForward, options)

    /**
     * Exact Forward this message
     * @param {String} jid
     * @param {Boolean} forceForward
     * @param {Object} options
     */
    m.copyNForward = (jid = m.chat, forceForward = true, options = {}) => conn.copyNForward(jid, m, forceForward, options)

    /**
     * Modify this Message
     * @param {String} jid 
     * @param {String} text 
     * @param {String} sender 
     * @param {Object} options 
     */
    m.cMod = (jid, text = '', sender = m.sender, options = {}) => conn.cMod(jid, m, text, sender, options)

    /**
     * Delete this message
     */
    m.delete = () => conn.sendMessage(m.chat, { delete: m.key })

    try {
        if (m.msg && m.mtype == 'protocolMessage') conn.ev.emit('message.delete', m.msg.key)
    } catch (e) {
        console.error(e)
    }
    return m
}

exports.logic = (check, inp, out) => {
    if (inp.length !== out.length) throw new Error('Input and Output must have same length')
    for (let i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i]
    return null
}

exports.protoType = () => {
  Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
    const ab = new ArrayBuffer(this.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < this.length; ++i) {
        view[i] = this[i];
    }
    return ab;
  }
  /**
   * @returns {ArrayBuffer}
   */
  Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
    return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength)
  }
  /**
   * @returns {Buffer}
   */
  ArrayBuffer.prototype.toBuffer = function toBuffer() {
    return Buffer.from(new Uint8Array(this))
  }
  // /**
  //  * @returns {String}
  //  */
  // Buffer.prototype.toUtilFormat = ArrayBuffer.prototype.toUtilFormat = Object.prototype.toUtilFormat = Array.prototype.toUtilFormat = function toUtilFormat() {
  //     return util.format(this)
  // }
  Uint8Array.prototype.getFileType = ArrayBuffer.prototype.getFileType = Buffer.prototype.getFileType = async function getFileType() {
    return await fileTypeFromBuffer(this)
  }
  /**
   * @returns {Boolean}
   */
  String.prototype.isNumber = Number.prototype.isNumber = isNumber
  /**
   *
   * @returns {String}
   */
  String.prototype.capitalize = function capitalize() {
    return this.charAt(0).toUpperCase() + this.slice(1, this.length)
  }
  /**
   * @returns {String}
   */
  String.prototype.capitalizeV2 = function capitalizeV2() {
    const str = this.split(' ')
    return str.map(v => v.capitalize()).join(' ')
  }
  String.prototype.decodeJid = function decodeJid() {
    if (/:\d+@/gi.test(this)) {
      const decode = jidDecode(this) || {}
      return (decode.user && decode.server && decode.user + '@' + decode.server || this).trim()
    } else return this.trim()
  }
  /**
   * number must be milliseconds
   * @returns {string}
   */
  Number.prototype.toTimeString = function toTimeString() {
    // const milliseconds = this % 1000
    const seconds = Math.floor((this / 1000) % 60)
    const minutes = Math.floor((this / (60 * 1000)) % 60)
    const hours = Math.floor((this / (60 * 60 * 1000)) % 24)
    const days = Math.floor((this / (24 * 60 * 60 * 1000)))
    return (
      (days ? `${days} day(s) ` : '') +
      (hours ? `${hours} hour(s) ` : '') +
      (minutes ? `${minutes} minute(s) ` : '') +
      (seconds ? `${seconds} second(s)` : '')
    ).trim()
  }
  Number.prototype.getRandom = String.prototype.getRandom = Array.prototype.getRandom = getRandom
}

function isNumber() {
  const int = parseInt(this)
  return typeof int === 'number' && !isNaN(int)
}

function getRandom() {
  if (Array.isArray(this) || this instanceof String) return this[Math.floor(Math.random() * this.length)]
  return Math.floor(Math.random() * this)
}

function rand(isi) {
     return isi[Math.floor(Math.random() * isi.length)]
}
