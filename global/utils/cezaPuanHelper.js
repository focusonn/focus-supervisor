const CezaPuan = require('../models/CezaPuan');
const CezaGecmis = require('../models/CezaGecmis');
const StaffConfig = require('../models/StaffConfig');

const PUAN_TABLOSU = {
  warn:       10,
  mute:       20,
  voicemute:  10,
  jail:       40,
  ban:       100,
};

const ESIKLER = [
  { puan: 100, aksiyon: 'ban',  label: 'Otomatik Ban' },
  { puan:  60, aksiyon: 'jail', label: 'Otomatik Jail' },
  { puan:  30, aksiyon: 'mute', label: 'Otomatik Mute (1 saat)', sure: 3600000 },
];

async function puanEkle(guild, member, tip, moderatorId, reason, sureMs = null) {
  const puan = PUAN_TABLOSU[tip] ?? 0;
  if (puan === 0) return { yeniPuan: 0, tetiklenen: null };

  const doc = await CezaPuan.findOneAndUpdate(
    { guildId: guild.id, userId: member.id },
    {
      $inc: { puan },
      $push: { kayitlar: { tip, puan, moderator: moderatorId, reason, tarih: new Date() } },
    },
    { upsert: true, new: true }
  );

  await CezaGecmis.create({
    guildId:   guild.id,
    userId:    member.id,
    tip,
    moderator: moderatorId,
    reason,
    sure:      sureMs,
    bitis:     sureMs ? new Date(Date.now() + sureMs) : null,
  });

  const cfg = await StaffConfig.findOne({ guildId: guild.id });
  const tetiklenen = await esikKontrol(guild, member, doc.puan, cfg);

  return { yeniPuan: doc.puan, tetiklenen };
}

async function puanAzalt(guildId, userId, miktar) {
  const doc = await CezaPuan.findOneAndUpdate(
    { guildId, userId },
    { $inc: { puan: -miktar } },
    { new: true }
  );
  if (doc && doc.puan < 0) {
    await CezaPuan.findOneAndUpdate({ guildId, userId }, { $set: { puan: 0 } });
    return 0;
  }
  return doc?.puan ?? 0;
}

async function esikKontrol(guild, member, toplamPuan, cfg) {
  const doc = await CezaPuan.findOne({ guildId: guild.id, userId: member.id });
  const tetiklenenler = doc?.tetiklenenler || [];

  for (const esik of ESIKLER) {
    if (toplamPuan >= esik.puan && !tetiklenenler.includes(esik.aksiyon)) {
      const logKanal = cfg?.logKanali ? guild.channels.cache.get(cfg.logKanali) : null;

      await CezaPuan.findOneAndUpdate(
        { guildId: guild.id, userId: member.id },
        { $addToSet: { tetiklenenler: esik.aksiyon } }
      );

      if (esik.aksiyon === 'ban') {
        await member.send(`**${guild.name}** sunucusundan ceza puani limitini astığın için otomatik olarak banlandın.`).catch(() => {});
        await member.ban({ reason: `Otomatik ban: ${toplamPuan} ceza puani` }).catch(() => {});
        if (logKanal) logKanal.send(`**Otomatik Ban** | <@${member.id}>\n> Ceza Puani: ${toplamPuan}`).catch(() => {});
        return esik.label;
      }

      if (esik.aksiyon === 'jail') {
        if (!cfg?.ceza_rolu) continue;
        await member.roles.add(cfg.ceza_rolu, `Otomatik jail: ${toplamPuan} ceza puani`).catch(() => {});
        await member.send(`**${guild.name}** sunucusunda ceza puani limitini astığın için otomatik jail cezası aldın.`).catch(() => {});
        if (logKanal) logKanal.send(`**Otomatik Jail** | <@${member.id}>\n> Ceza Puani: ${toplamPuan}`).catch(() => {});
        await CezaGecmis.create({ guildId: guild.id, userId: member.id, tip: 'jail', moderator: 'AUTO', reason: `Otomatik jail: ${toplamPuan}p` });
        return esik.label;
      }

      if (esik.aksiyon === 'mute') {
        await member.timeout(esik.sure, `Otomatik mute: ${toplamPuan} ceza puani`).catch(() => {});
        await member.send(`**${guild.name}** sunucusunda ceza puani limitini astığın için 1 saat susturuldun.`).catch(() => {});
        if (logKanal) logKanal.send(`**Otomatik Mute (1s)** | <@${member.id}>\n> Ceza Puani: ${toplamPuan}`).catch(() => {});
        await CezaGecmis.create({ guildId: guild.id, userId: member.id, tip: 'mute', moderator: 'AUTO', reason: `Otomatik mute: ${toplamPuan}p`, sure: esik.sure, bitis: new Date(Date.now() + esik.sure) });
        return esik.label;
      }
    }
  }
  return null;
}

async function puanSifirla(guildId, userId) {
  await CezaPuan.findOneAndUpdate(
    { guildId, userId },
    { $set: { puan: 0, kayitlar: [], tetiklenenler: [] } },
    { upsert: true }
  );
}

async function puanGetir(guildId, userId) {
  return CezaPuan.findOne({ guildId, userId });
}

async function gecmisGetir(guildId, userId, limit = 10) {
  return CezaGecmis.find({ guildId, userId }).sort({ createdAt: -1 }).limit(limit);
}

module.exports = { puanEkle, puanAzalt, puanSifirla, puanGetir, gecmisGetir, PUAN_TABLOSU, ESIKLER };
