const { ChannelType, PermissionFlagsBits } = require('discord.js');
const OzelOda          = require('../global/models/OzelOda');
const OzelOdaConfig    = require('../global/models/OzelOdaConfig');
const StaffConfig      = require('../global/models/StaffConfig');
const Stat             = require('../global/models/Stat');
const StreamerLbConfig = require('../global/models/StreamerLbConfig');
const StreamerStat     = require('../global/models/StreamerStat');
const settings         = require('../global/settings/settings.json');

const aktifSureler = new Map();

const streamerAktif = new Map();

const STREAMER_CATS = ['kayit', 'public', 'streamer', 'sorun_cozme', 'secret', 'private'];

async function streamerSesKaydet(guildId, userId, kategori, baslangic) {
  const dk = Math.floor((Date.now() - baslangic) / 60000);
  if (dk > 0) {
    await StreamerStat.findOneAndUpdate(
      { guildId, userId },
      { $inc: { [kategori]: dk } },
      { upsert: true }
    );
  }
}

async function streamerKategoriGetir(guild, channelId) {
  const cfg = await StreamerLbConfig.findOne({ guildId: guild.id });
  if (!cfg) return null;

  const kanal = guild.channels.cache.get(channelId);
  if (!kanal || !kanal.parentId) return null;

  for (const cat of STREAMER_CATS) {
    const ayarliId = cfg[cat];
    if (ayarliId && ayarliId === kanal.parentId) return cat;
  }
  return null;
}

module.exports = {
  name: 'voiceStateUpdate',
  once: false,
  async execute(oldState, newState, focus) {
    try {
      const guild = newState.guild || oldState.guild;
      if (!guild) return;
      if (settings.guildID && guild.id !== settings.guildID) return;

      
      const userId  = newState.member?.id || oldState.member?.id;
      const guildId = guild.id;
      if (userId) {
        const key = `${guildId}_${userId}`;
        const now = Date.now();
        const entry = aktifSureler.get(key) || {};

        
        const eskiKanalId = oldState.channelId;
        const yeniKanalId = newState.channelId;

        if (eskiKanalId !== yeniKanalId) {
          
          if (eskiKanalId) {
            const sKey = `${guildId}_${userId}`;
            const sEntry = streamerAktif.get(sKey);
            if (sEntry) {
              await streamerSesKaydet(guildId, userId, sEntry.kategori, sEntry.baslangic);
              streamerAktif.delete(sKey);
            }
          }
          
          if (yeniKanalId) {
            const kat = await streamerKategoriGetir(guild, yeniKanalId);
            if (kat) {
              streamerAktif.set(`${guildId}_${userId}`, { kategori: kat, baslangic: now });
            }
          }
        }

        const eskiKamera = oldState.selfVideo;
        const yeniKamera = newState.selfVideo;
        const eskiYayin  = oldState.streaming;
        const yeniYayin  = newState.streaming;

        
        if (eskiKamera && !yeniKamera && entry.kamera) {
          const dk = Math.floor((now - entry.kamera) / 60000);
          if (dk > 0) await Stat.findOneAndUpdate({ guildId, userId }, { $inc: { kamera: dk } }, { upsert: true });
          delete entry.kamera;
        }
        
        if (!eskiKamera && yeniKamera) entry.kamera = now;

        
        if (eskiYayin && !yeniYayin && entry.yayin) {
          const dk = Math.floor((now - entry.yayin) / 60000);
          if (dk > 0) await Stat.findOneAndUpdate({ guildId, userId }, { $inc: { yayin: dk } }, { upsert: true });
          delete entry.yayin;
        }
        
        if (!eskiYayin && yeniYayin) entry.yayin = now;

        
        if (oldState.channel && !newState.channel) {
          if (entry.kamera) {
            const dk = Math.floor((now - entry.kamera) / 60000);
            if (dk > 0) await Stat.findOneAndUpdate({ guildId, userId }, { $inc: { kamera: dk } }, { upsert: true });
            delete entry.kamera;
          }
          if (entry.yayin) {
            const dk = Math.floor((now - entry.yayin) / 60000);
            if (dk > 0) await Stat.findOneAndUpdate({ guildId, userId }, { $inc: { yayin: dk } }, { upsert: true });
            delete entry.yayin;
          }
          if (entry.ses) {
            const dk = Math.floor((now - entry.ses) / 60000);
            if (dk > 0) await Stat.findOneAndUpdate({ guildId, userId }, { $inc: { ses: dk } }, { upsert: true });
            delete entry.ses;
          }
        }

        
        const voiceId = settings.voiceID;
        if (voiceId) {
          const eskiKanal = oldState.channelId;
          const yeniKanal = newState.channelId;

          
          if (!eskiKanal && yeniKanal) {
            entry.ses = now;
          }
          
          
          if (eskiKanal && yeniKanal && eskiKanal !== yeniKanal) {
            if (entry.ses) {
              const dk = Math.floor((now - entry.ses) / 60000);
              if (dk > 0) await Stat.findOneAndUpdate({ guildId, userId }, { $inc: { ses: dk } }, { upsert: true });
            }
            entry.ses = now;
          }
        }

        if (Object.keys(entry).length > 0) aktifSureler.set(key, entry);
        else aktifSureler.delete(key);
      }

      
      const cfg = await OzelOdaConfig.findOne({ guildId: guild.id });
      if (!cfg) return;

      const catName   = cfg.categoryName;
      const voiceName = cfg.voiceChannelName;

      
      const giris = newState.channel;
      if (giris && giris.type === ChannelType.GuildVoice) {
        const parent = giris.parent;

        
        const dogruKategori = cfg.categoryId
          ? parent?.id === cfg.categoryId
          : parent?.name?.toLowerCase() === catName?.toLowerCase();

        
        const olusturKanali = dogruKategori && (
          cfg.voiceChannelId
            ? giris.id === cfg.voiceChannelId
            : giris.name.toLowerCase() === voiceName?.toLowerCase()
        );

        if (olusturKanali && newState.member) {
          
          const mevcutKayit = await OzelOda.findOne({ guildId: guild.id, ownerId: newState.member.id });
          if (mevcutKayit) {
            const mevcutKanal = guild.channels.cache.get(mevcutKayit.channelId);
            if (mevcutKanal) {
              await newState.member.voice.setChannel(mevcutKanal).catch(() => {});
              return;
            }
            await OzelOda.deleteOne({ _id: mevcutKayit._id });
          }

          const staffCfg = await StaffConfig.findOne({ guildId: guild.id });
          const izinliRoller = [
            ...(staffCfg?.register?.sorumluluk || []),
            ...(staffCfg?.register?.denetim    || []),
            ...(staffCfg?.register?.lider      || []),
          ].filter(Boolean);

          const ad = `${newState.member.displayName} Odasi`;
          const overwrites = [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
            { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.ManageChannels] },
            { id: newState.member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.ManageChannels] },
            ...izinliRoller.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] })),
          ];

          const yeniKanal = await guild.channels.create({
            name: ad,
            type: ChannelType.GuildVoice,
            parent: parent,
            userLimit: 0,
            permissionOverwrites: overwrites,
          }).catch(() => null);

          if (yeniKanal) {
            await newState.member.voice.setChannel(yeniKanal).catch(() => {});
            await OzelOda.create({
              guildId:   guild.id,
              ownerId:   newState.member.id,
              channelId: yeniKanal.id,
              locked:    false,
            });
          }
        }
      }

      
      const cikis = oldState.channel;
      if (cikis && cikis.type === ChannelType.GuildVoice) {
        const parent = cikis.parent;
        const dogruKategori = cfg.categoryId
          ? parent?.id === cfg.categoryId
          : parent?.name?.toLowerCase() === catName?.toLowerCase();

        if (!dogruKategori) return;

        const olusturKanalMi = cfg.voiceChannelId
          ? cikis.id === cfg.voiceChannelId
          : cikis.name.toLowerCase() === voiceName?.toLowerCase();

        if (olusturKanalMi) return;

        const kayit = await OzelOda.findOne({ guildId: guild.id, channelId: cikis.id });
        if (kayit && cikis.members.size === 0) {
          await cikis.delete().catch(() => {});
          await OzelOda.deleteOne({ guildId: guild.id, channelId: cikis.id });
        }
      }
    } catch {}
  },
};
