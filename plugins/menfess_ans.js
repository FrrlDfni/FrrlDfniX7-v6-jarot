const delay = time => new Promise(res => setTimeout(res, time))

let handler = m => m

handler.all = async function (m) {

	if (!m.chat.endsWith('@s.whatsapp.net')) return !0;

	this.menfess = this.menfess ? this.menfess : {}

	let mf = Object.values(this.menfess).find(v => v.status === false && v.penerima == m.sender)

	if (!mf) return !0

	console.log({ text: m.text })

	if ((m.text === 'BALAS PESAN' || m.text === '') && m.quoted.mtype == 'buttonMessage') return m.reply("Silahkan Ketik Pesan Balasan Mu");

	

	let txt = `𝘏𝘢𝘪 𝘒𝘢𝘬@${mf.dari.split('@')[0]}, 𝘒𝘢𝘮𝘶 𝘔𝘦𝘯𝘦𝘳𝘪𝘮𝘢 𝘗𝘦𝘴𝘢𝘯 𝘉𝘢𝘭𝘢𝘴𝘢𝘯 𝘕𝘪𝘩\n\n𝘗𝘦𝘴𝘢𝘯 𝘠𝘢𝘯𝘨 𝘒𝘢𝘮𝘶 𝘒𝘪𝘳𝘪𝘮 𝘚𝘦𝘣𝘦𝘭𝘶𝘮 𝘕𝘺𝘢 ⤵️\n${mf.pesan}\n\n𝘗𝘦𝘴𝘢𝘯 𝘉𝘢𝘭𝘢𝘴𝘢𝘯𝘯𝘺𝘢 ⤵️\n${m.text}\n`.trim();

	await this.reply(mf.dari, txt, null).then(() => {

		m.reply('✔️ Berhasil mengirim balasan.')

		delay(2000)

		delete this.menfess[mf.id]

		return !0

		})

	return !0

}



module.exports = handler
