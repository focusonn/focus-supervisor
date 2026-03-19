const { puanGetir, PUAN_TABLOSU, ESIKLER } = require('../../global/utils/cezaPuanHelper');
const { hasRole } = require('../../global/utils/staffHelper');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'cezapuan',
  aliases: ['cp'],
  category: 'Ceza',
  async execute(message, args, focus) {
    const target = message.mentions.members.first() ||
                   (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : message.member);
    if (!target) return message.reply('Gecerli bir kullanici belirt.');

    if (target.id !== message.author.id) {
      const yetkili = await hasRole(message.member, message.guild.id, ['chat', 'mute', 'ban_jail'], 'sorumluluk') ||
                      message.member.permissions.has('ManageGuild') ||
                      message.author.id === settings.ownerID;
      if (!yetkili) return message.reply('Baskasinin ceza puanini gormek icin yetkili olmalisin.');
    }

    const doc = await puanGetir(message.guild.id, target.id);
    const puan = doc?.puan ?? 0;
    const kayitlar = doc?.kayitlar?.slice(-5).reverse() ?? [];

    const sonrakiEsik = ESIKLER.slice().reverse().find(e => puan < e.puan);

    const puanTablosu = Object.entries(PUAN_TABLOSU)
      .map(([tip, p]) => `${tip}: ${p}p`)
      .join(' | ');

    const gecmis = kayitlar.length
      ? kayitlar.map(k => `> **${k.tip}** +${k.puan}p — ${k.reason} *(${new Date(k.tarih).toLocaleDateString('tr-TR')})*`).join('\n')
      : '> Kayit yok';

    const esikBilgi = sonrakiEsik
      ? `Sonraki esik: **${sonrakiEsik.label}** (${sonrakiEsik.puan}p — ${sonrakiEsik.puan - puan}p kaldi)`
      : 'En yuksek esige ulasildi.';

    return message.reply(
      `**${target.user.tag}** Ceza Puani\n` +
      `> Toplam Puan : **${puan}**\n` +
      `> ${esikBilgi}\n\n` +
      `**Son 5 Kayit:**\n${gecmis}\n\n` +
      `*Puan tablosu: ${puanTablosu}*`
    );
  },
};
