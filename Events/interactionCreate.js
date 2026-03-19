const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const Warn = require('../global/models/Warn');
const { puanGetir, ESIKLER, gecmisGetir } = require('../global/utils/cezaPuanHelper');
const settings = require('../global/settings/settings.json');
const Stat = require('../global/models/Stat');
const Tweet = require('../global/models/Tweet');
const ConfessionConfig = require('../global/models/ConfessionConfig');
const RoleMenuConfig = require('../global/models/RoleMenuConfig');
const StaffConfig = require('../global/models/StaffConfig');
const StaffApplication = require('../global/models/StaffApplication');
const YetkiliApplication = require('../global/models/YetkiliApplication');
const StreamerApplication = require('../global/models/StreamerApplication');
const SorunApplication = require('../global/models/SorunApplication');
const { updateTweetMessage } = require('../global/utils/tweetHelper');
const { containsProfanity } = require('../global/utils/filterHelper');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, focus) {
    if (settings.guildID && interaction.guild?.id !== settings.guildID) return;

    if (interaction.isButton()) {
      const id = interaction.customId;

      
      if (id.startsWith('kp_')) {
        const userId  = interaction.user.id;
        const guildId = interaction.guild.id;
        const member  = interaction.member;

        if (id === 'kp_istek' || id === 'kp_oneri' || id === 'kp_sikayet') {
          const titles = { kp_istek: 'Istek Bildirimi', kp_oneri: 'Oneri Bildirimi', kp_sikayet: 'Sikayet Bildirimi' };
          const modal = new ModalBuilder()
            .setCustomId(`kp_modal_${id.replace('kp_', '')}`)
            .setTitle(titles[id]);
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('metin')
                .setLabel('Mesajini yaz')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1000)
                .setPlaceholder('Lutfen detayli bir sekilde aciklayiniz...')
            )
          );
          return interaction.showModal(modal);
        }

        if (id === 'kp_yardim') {
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Yardim**\n` +
              `> Bot komutlarini gormek icin \`.yardim\` yazabilirsin.\n` +
              `> Herhangi bir sorun icin yetkililere ulasabilirsin.`
            )
          );
          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        if (id === 'kp_user') {
          const stat = await Stat.findOne({ guildId, userId }).catch(() => null);
          const joinedTs = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
          const createdTs = Math.floor(interaction.user.createdTimestamp / 1000);
          const rolSayisi = member.roles.cache.filter(r => r.id !== interaction.guild.id).size;

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Kullanici Bilgi**\n` +
              `> Kullanici   : <@${userId}>\n` +
              `> Katilma     : ${joinedTs ? `<t:${joinedTs}:R>` : 'bilinmiyor'}\n` +
              `> Hesap Acilis: <t:${createdTs}:R>\n` +
              `> Rol Sayisi  : **${rolSayisi}**\n` +
              `> Mesaj Sayisi: **${stat?.mesaj ?? 0}**\n` +
              `> Ses Suresi  : **${stat?.ses ?? 0}** dk`
            )
          );
          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        if (id === 'kp_ceza') {
          const [warns, puanDoc, cfg] = await Promise.all([
            Warn.find({ guildId, userId }).sort({ createdAt: -1 }).limit(5),
            puanGetir(guildId, userId),
            StaffConfig.findOne({ guildId }),
          ]);
          const puan = puanDoc?.puan ?? 0;
          const muteBitis = member.communicationDisabledUntilTimestamp;
          const muteKalan = muteBitis && muteBitis > Date.now() ? muteBitis - Date.now() : null;
          const jailVar = cfg?.ceza_rolu && member.roles.cache.has(cfg.ceza_rolu);

          function fmtMs(ms) {
            const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
            return [d && `${d}g`, h && `${h}s`, m && `${m}d`].filter(Boolean).join(' ') || `${s % 60}sn`;
          }

          const aktif = [];
          if (muteKalan) aktif.push(`> Mute — Kalan: **${fmtMs(muteKalan)}** (<t:${Math.floor(muteBitis / 1000)}:R>)`);
          if (jailVar) aktif.push('> Jail — Aktif');
          if (!aktif.length) aktif.push('> Aktif ceza yok.');

          const warnLines = warns.length
            ? warns.map((w, i) => `> **${i + 1}.** <@${w.moderator}> — ${w.reason} *(${new Date(w.createdAt).toLocaleDateString('tr-TR')})*`).join('\n')
            : '> Uyari gecmisi yok.';

          const sonrakiEsik = ESIKLER.slice().reverse().find(e => puan < e.puan);

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Ceza Bilgi**\n` +
              `> Ceza Puani  : **${puan}** / 100\n` +
              `> Uyari Sayisi: **${warns.length}**`
            )
          );
          container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Aktif Cezalar**\n${aktif.join('\n')}\n\n` +
              (sonrakiEsik ? `> Sonraki esik: **${sonrakiEsik.label}** — ${sonrakiEsik.puan - puan}p kaldi` : '> En yuksek esige ulasildi.')
            )
          );
          container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Son 5 Uyari**\n${warnLines}`));
          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        if (id === 'kp_stat') {
          const stat = await Stat.findOne({ guildId, userId }).catch(() => null);
          const allStats = await Stat.find({ guildId }).sort({ mesaj: -1 }).lean().catch(() => []);
          const mesajSira = allStats.findIndex(s => s.userId === userId) + 1;
          const sesSira   = [...allStats].sort((a, b) => (b.ses ?? 0) - (a.ses ?? 0)).findIndex(s => s.userId === userId) + 1;

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Istatistik**\n` +
              `> Mesaj Sayisi : **${stat?.mesaj ?? 0}** (Sira: #${mesajSira || '?'})\n` +
              `> Ses Suresi   : **${stat?.ses ?? 0}** dk (Sira: #${sesSira || '?'})\n` +
              `> Davet        : **${stat?.invite ?? 0}**\n` +
              `> Davet Kullan.: **${stat?.inviteKullanilan ?? 0}**`
            )
          );
          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        if (id === 'kp_sicil') {
          const gecmis = await gecmisGetir(guildId, userId, 10);
          const TIP_LABEL = {
            warn: 'Uyari', mute: 'Mute', voicemute: 'Ses Mute', jail: 'Jail', ban: 'Ban',
            unwarn: 'Uyari Silindi', unmute: 'Mute Kaldirildi', unjail: 'Jail Kaldirildi', unban: 'Ban Kaldirildi',
          };
          const lines = gecmis.length
            ? gecmis.map(k => {
                const mod = k.moderator === 'AUTO' ? 'Otomatik' : `<@${k.moderator}>`;
                return `> **${TIP_LABEL[k.tip] || k.tip}** — ${k.reason} | ${mod} *(${new Date(k.createdAt).toLocaleDateString('tr-TR')})*`;
              }).join('\n')
            : '> Sicil kaydi yok.';

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Sicilim** (son 10)\n${lines}`));
          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        if (id === 'kp_siralama') {
          const allStats = await Stat.find({ guildId }).lean().catch(() => []);
          const mesajSira = [...allStats].sort((a, b) => (b.mesaj ?? 0) - (a.mesaj ?? 0)).findIndex(s => s.userId === userId) + 1;
          const sesSira   = [...allStats].sort((a, b) => (b.ses ?? 0) - (a.ses ?? 0)).findIndex(s => s.userId === userId) + 1;
          const davetSira = [...allStats].sort((a, b) => (b.invite ?? 0) - (a.invite ?? 0)).findIndex(s => s.userId === userId) + 1;
          const stat = allStats.find(s => s.userId === userId);

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Siralamam** (${allStats.length} kisi icinde)\n` +
              `> Mesaj : #**${mesajSira || '?'}** (${stat?.mesaj ?? 0} mesaj)\n` +
              `> Ses   : #**${sesSira || '?'}** (${stat?.ses ?? 0} dk)\n` +
              `> Davet : #**${davetSira || '?'}** (${stat?.invite ?? 0} davet)`
            )
          );
          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        if (id === 'kp_roller') {
          const roller = member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => `<@&${r.id}>`)
            .join(', ') || 'Hic rol yok.';
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Rol & Yetkilerim** (${member.roles.cache.size - 1} rol)\n> ${roller}`
            )
          );
          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        if (id === 'kp_sure') {
          const cfg = await StaffConfig.findOne({ guildId });
          const muteBitis = member.communicationDisabledUntilTimestamp;
          const muteKalan = muteBitis && muteBitis > Date.now() ? muteBitis - Date.now() : null;
          const jailVar = cfg?.ceza_rolu && member.roles.cache.has(cfg.ceza_rolu);

          function fmtMs(ms) {
            const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
            return [d && `${d}g`, h && `${h}s`, m && `${m}d`].filter(Boolean).join(' ') || `${s % 60}sn`;
          }

          const lines = [];
          if (muteKalan) {
            lines.push(`> Mute — Bitis: <t:${Math.floor(muteBitis / 1000)}:F>\n> Kalan: **${fmtMs(muteKalan)}** (<t:${Math.floor(muteBitis / 1000)}:R>)`);
          } else {
            lines.push('> Aktif mute yok.');
          }
          lines.push(jailVar ? '> Jail — Aktif (ceza rolu mevcut)' : '> Aktif jail yok.');

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Kalan Surem**\n${lines.join('\n')}`));
          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        return;
      }

      
      if (id === 'cezapanel_cezalarim' || id === 'cezapanel_liste' || id === 'cezapanel_sure') {
        const { handleButton } = require('../Commands/BotOwner/ceza-panel');
        return handleButton(interaction);
      }

      
      if (id.startsWith('tweet_begen_')) {
        const tweetId = id.replace('tweet_begen_', '');
        const tweet = await Tweet.findOne({ tweetId });
        if (!tweet) return interaction.reply({ content: 'Tweet bulunamadi.', flags: MessageFlags.Ephemeral });
        const idx = tweet.likes.indexOf(interaction.user.id);
        if (idx === -1) tweet.likes.push(interaction.user.id);
        else tweet.likes.splice(idx, 1);
        await tweet.save();
        return updateTweetMessage(interaction, tweet);
      }

      if (id.startsWith('tweet_repost_')) {
        const tweetId = id.replace('tweet_repost_', '');
        const tweet = await Tweet.findOne({ tweetId });
        if (!tweet) return interaction.reply({ content: 'Tweet bulunamadi.', flags: MessageFlags.Ephemeral });
        const idx = tweet.reposts.indexOf(interaction.user.id);
        if (idx === -1) tweet.reposts.push(interaction.user.id);
        else tweet.reposts.splice(idx, 1);
        await tweet.save();
        return updateTweetMessage(interaction, tweet);
      }

      if (id.startsWith('tweet_yorum_') && !id.startsWith('tweet_yorumlar_')) {
        const tweetId = id.replace('tweet_yorum_', '');
        const modal = new ModalBuilder()
          .setCustomId(`tweet_yorum_modal_${tweetId}`)
          .setTitle('Yorum Yap');
        const input = new TextInputBuilder()
          .setCustomId('yorum_input')
          .setLabel('Yorumunuz')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(280)
          .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      if (id.startsWith('tweet_yorumlar_')) {
        const tweetId = id.replace('tweet_yorumlar_', '');
        const tweet = await Tweet.findOne({ tweetId });
        if (!tweet) return interaction.reply({ content: 'Tweet bulunamadi.', flags: MessageFlags.Ephemeral });
        if (tweet.comments.length === 0)
          return interaction.reply({ content: 'Henuz yorum yok.', flags: MessageFlags.Ephemeral });

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**Yorumlar** (${tweet.comments.length})`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );
        const last10 = tweet.comments.slice(-10).reverse();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            last10.map(c => `> **${c.username}**: ${c.content}`).join('\n')
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith('tweet_sil_')) {
        const tweetId = id.replace('tweet_sil_', '');
        const tweet = await Tweet.findOne({ tweetId });
        if (!tweet) return interaction.reply({ content: 'Tweet bulunamadi.', flags: MessageFlags.Ephemeral });
        if (tweet.authorId !== interaction.user.id && !interaction.member.permissions.has('ManageMessages'))
          return interaction.reply({ content: 'Bu tweeti silme yetkiniz yok.', flags: MessageFlags.Ephemeral });
        await Tweet.deleteOne({ tweetId });
        await interaction.message.delete().catch(() => {});
        await interaction.deferUpdate().catch(() => {});
        return;
      }

      
      if (id === 'yetkili_basvuru_ac') {
        const modal = new ModalBuilder()
          .setCustomId('yetkili_modal')
          .setTitle('Yetkili Basvurusu');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('yas').setLabel('Yasiniz').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('tecrube').setLabel('Sunucu yonetimi / moderasyon tecrübeniz').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('saat').setLabel('Gunluk kac saat aktif olabilirsiniz?').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('neden').setLabel('Neden yetkili olmak istiyorsunuz?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
          ),
        );
        return interaction.showModal(modal);
      }

      
      if (id === 'streamer_basvuru_ac') {
        const modal = new ModalBuilder()
          .setCustomId('streamer_modal')
          .setTitle('Streamer Basvurusu');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('platform').setLabel('Yayin platformunuz (Twitch, YouTube vb.)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('kanal').setLabel('Kanal / kullanici adiniz').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('icerik').setLabel('Ne tur icerik uretiyorsunuz?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('izleyici').setLabel('Ortalama izleyici / abone sayiniz').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('neden').setLabel('Neden bu sunucuda yayin yapmak istiyorsunuz?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
          ),
        );
        return interaction.showModal(modal);
      }

      
      if (id === 'sorun_basvuru_ac') {
        const modal = new ModalBuilder()
          .setCustomId('sorun_modal')
          .setTitle('Sorun Bildir');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('sorun').setLabel('Sorunun ne?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('hedef').setLabel('Sorun kimi / neyi etkiliyor?').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(200)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('neden').setLabel('Ek aciklama (opsiyonel)').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(300)
          ),
        );
        return interaction.showModal(modal);
      }

      
      if (id === 'confession_open') {
        const modal = new ModalBuilder()
          .setCustomId('confession_modal')
          .setTitle('Anonim Itiraf');
        const input = new TextInputBuilder()
          .setCustomId('confession_input')
          .setLabel('Itirafin')
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(10)
          .setMaxLength(1000)
          .setPlaceholder('Itirafini buraya yaz...')
          .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      
      if (id.startsWith('kayit_erkek_') || id.startsWith('kayit_kiz_') ||
          id.startsWith('kayit_sicil_') || id.startsWith('kayit_iptal_')) {
        const guildId = interaction.guild.id;

        
        if (id.startsWith('kayit_erkek_') || id.startsWith('kayit_kiz_')) {
          const erkekMi = id.startsWith('kayit_erkek_');
          const prefix  = erkekMi ? 'kayit_erkek_' : 'kayit_kiz_';
          const parts   = id.replace(prefix, '').split('_');
          const hedefId  = parts[0];
          const yetkiliId = parts[1];
          const isim     = decodeURIComponent(parts.slice(2).join('_'));

          
          if (interaction.user.id !== yetkiliId)
            return interaction.reply({ content: 'Bu butonu sadece komutu kullanan yetkili kullanabilir.', flags: MessageFlags.Ephemeral });

          const target = await interaction.guild.members.fetch(hedefId).catch(() => null);
          if (!target)
            return interaction.reply({ content: 'Kullanici sunucuda bulunamadi.', flags: MessageFlags.Ephemeral });

          const cfg = await StaffConfig.findOne({ guildId });
          const rolId = erkekMi ? cfg?.erkekRolu : cfg?.kizRolu;
          if (!rolId)
            return interaction.reply({ content: `${erkekMi ? 'Erkek' : 'Kiz'} rolu ayarlanmamis.`, flags: MessageFlags.Ephemeral });

          const { kayitYap } = require('../Commands/Register/kayit');
          const container = await kayitYap(interaction.guild, target, isim, erkekMi, yetkiliId);
          if (!container)
            return interaction.reply({ content: 'Kayit sirasinda hata olustu.', flags: MessageFlags.Ephemeral });

          return interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }

        
        if (id.startsWith('kayit_sicil_')) {
          const hedefId = id.replace('kayit_sicil_', '');
          const { gecmisGetir, puanGetir } = require('../global/utils/cezaPuanHelper');
          const Warn = require('../global/models/Warn');

          const [gecmis, puanDoc, warns] = await Promise.all([
            gecmisGetir(guildId, hedefId, 10),
            puanGetir(guildId, hedefId),
            Warn.find({ guildId, userId: hedefId }).sort({ createdAt: -1 }).limit(5),
          ]);

          const TIP_LABEL = {
            warn: 'Uyari', mute: 'Mute', voicemute: 'Ses Mute', jail: 'Jail', ban: 'Ban',
            unwarn: 'Uyari Silindi', unmute: 'Mute Kaldirildi', unjail: 'Jail Kaldirildi', unban: 'Ban Kaldirildi',
          };
          const lines = gecmis.length
            ? gecmis.map(k => {
                const mod = k.moderator === 'AUTO' ? 'Otomatik' : `<@${k.moderator}>`;
                return `> **${TIP_LABEL[k.tip] || k.tip}** — ${k.reason} | ${mod} *(${new Date(k.createdAt).toLocaleDateString('tr-TR')})*`;
              }).join('\n')
            : '> Sicil kaydi yok.';

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Sicil Sorgulama** — <@${hedefId}>\n` +
              `> Ceza Puani  : **${puanDoc?.puan ?? 0}** / 100\n` +
              `> Uyari Sayisi: **${warns.length}**\n\n` +
              `**Son 10 Kayit**\n${lines}`
            )
          );
          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        
        if (id.startsWith('kayit_iptal_')) {
          const parts    = id.split('_');
          const hedefId  = parts[2];
          const yetkiliId = parts[3];

          
          const izinli = interaction.user.id === yetkiliId ||
            interaction.member.permissions.has('ManageGuild') ||
            interaction.user.id === settings.ownerID;
          if (!izinli)
            return interaction.reply({ content: 'Bu islemi sadece kaydi yapan yetkili geri alabilir.', flags: MessageFlags.Ephemeral });

          const cfg = await StaffConfig.findOne({ guildId });
          const target = await interaction.guild.members.fetch(hedefId).catch(() => null);
          if (!target)
            return interaction.reply({ content: 'Kullanici sunucuda bulunamadi.', flags: MessageFlags.Ephemeral });

          
          const rollerToRemove = [cfg?.erkekRolu, cfg?.kizRolu, cfg?.ortakRolu].filter(Boolean);
          for (const rid of rollerToRemove) {
            if (target.roles.cache.has(rid)) await target.roles.remove(rid).catch(() => {});
          }

          
          const { getUser } = require('../global/utils/statDB');
          const yetkiliStat = await getUser(guildId, yetkiliId);
          if (yetkiliStat.kayit > 0) { yetkiliStat.kayit -= 1; await yetkiliStat.save(); }

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Kayit Geri Alindi**\n` +
              `> Kullanici : <@${hedefId}>\n` +
              `> Islem     : <@${interaction.user.id}> tarafindan geri alindi.`
            )
          );
          return interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }
      }

      
      if (id.startsWith('welcome_sicil_') || id.startsWith('welcome_yetkili_')) {
        const hedefId = id.split('_').pop();
        const guildId = interaction.guild.id;

        if (id.startsWith('welcome_sicil_')) {
          const { gecmisGetir } = require('../global/utils/cezaPuanHelper');
          const { puanGetir }   = require('../global/utils/cezaPuanHelper');
          const Warn = require('../global/models/Warn');

          const [gecmis, puanDoc, warns] = await Promise.all([
            gecmisGetir(guildId, hedefId, 10),
            puanGetir(guildId, hedefId),
            Warn.find({ guildId, userId: hedefId }).sort({ createdAt: -1 }).limit(5),
          ]);

          const TIP_LABEL = {
            warn: 'Uyari', mute: 'Mute', voicemute: 'Ses Mute', jail: 'Jail', ban: 'Ban',
            unwarn: 'Uyari Silindi', unmute: 'Mute Kaldirildi', unjail: 'Jail Kaldirildi', unban: 'Ban Kaldirildi',
          };

          const lines = gecmis.length
            ? gecmis.map(k => {
                const mod = k.moderator === 'AUTO' ? 'Otomatik' : `<@${k.moderator}>`;
                return `> **${TIP_LABEL[k.tip] || k.tip}** — ${k.reason} | ${mod} *(${new Date(k.createdAt).toLocaleDateString('tr-TR')})*`;
              }).join('\n')
            : '> Sicil kaydi yok.';

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Sicil Sorgulama** — <@${hedefId}>\n` +
              `> Ceza Puani : **${puanDoc?.puan ?? 0}** / 100\n` +
              `> Uyari Sayisi: **${warns.length}**\n\n` +
              `**Son 10 Kayit**\n${lines}`
            )
          );
          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        if (id.startsWith('welcome_yetkili_')) {
          const cfg = await StaffConfig.findOne({ guildId });
          const registerRoller = [
            ...(cfg?.register?.sorumluluk || []),
            ...(cfg?.register?.denetim    || []),
            ...(cfg?.register?.lider      || []),
          ];

          const mentionlar = registerRoller.map(rid => `<@&${rid}>`).join(' ');

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Yetkili Cagirma** — <@${hedefId}> icin kayit yetkilisi isteniyor.\n\n` +
              (mentionlar || '> Kayit sorumlusu rolu ayarlanmamis.')
            )
          );

          
          
          
          if (mentionlar) {
            await interaction.channel.send({ content: mentionlar, allowedMentions: { parse: ['roles'] } }).catch(() => {});
          }

          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }
      }

      
      if (id.startsWith('ozel_')) {
        const { handleOzelOdaButton } = require('../Commands/BotOwner/ozeloda-kur');
        return handleOzelOdaButton(interaction);
      }

      
      if (id.startsWith('lb_filtre_')) {
        
        const parts = id.split('_');
        const tip = parts[2] === 'all' ? null : parts[2];
        const gun = parseInt(parts[3]) || 0;
        const { buildFiltreModal } = require('../Commands/Istatistik/leaderboard');
        return interaction.showModal(buildFiltreModal(tip, gun));
      }

      
      if (id.startsWith('rm_etkinlik_')) {
        const roleId = id.replace('rm_etkinlik_', '');
        const member = interaction.member;
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(roleId).catch(() => {});
          return interaction.reply({ content: `Rol kaldirildi: <@&${roleId}>`, flags: MessageFlags.Ephemeral });
        } else {
          await member.roles.add(roleId).catch(() => {});
          return interaction.reply({ content: `Rol verildi: <@&${roleId}>`, flags: MessageFlags.Ephemeral });
        }
      }
    }

    
    if (interaction.isUserSelectMenu()) {
      if (interaction.customId === 'ozel_kisi_ekle_select') {
        const { handleOzelOdaSelect } = require('../Commands/BotOwner/ozeloda-kur');
        return handleOzelOdaSelect(interaction);
      }
    }

    
    if (interaction.isStringSelectMenu()) {
      const id = interaction.customId;

      
      if (id === 'slb_cat') {
        const cat = interaction.values[0];
        const { buildStreamerLb } = require('../Commands/Istatistik/streamer-leaderboard');
        await interaction.guild.members.fetch().catch(() => {});
        const container = await buildStreamerLb(interaction.guild, cat);
        await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });

        
        const msg = await interaction.fetchReply().catch(() => null);
        if (!msg) return;
        const interval = setInterval(async () => {
          try {
            await interaction.guild.members.fetch().catch(() => {});
            const updated = await buildStreamerLb(interaction.guild, cat);
            await msg.edit({ components: [updated], flags: MessageFlags.IsComponentsV2 });
          } catch {
            clearInterval(interval);
          }
        }, 60_000);
        setTimeout(() => clearInterval(interval), 3_600_000);
        return;
      }

      
      if (id === 'ozel_kisi_cikar_select') {
        const { handleOzelOdaSelect } = require('../Commands/BotOwner/ozeloda-kur');
        return handleOzelOdaSelect(interaction);
      }

      
      if (id.startsWith('mute_sure_')) {
        const parts = id.split('_');
        const targetId    = parts[2];
        const reason      = decodeURIComponent(parts[3]);
        const moderatorId = parts[4];

        if (interaction.user.id !== moderatorId) {
          return interaction.reply({ content: 'Bu menuyu sadece komutu kullanan kisi kullanabilir.', flags: MessageFlags.Ephemeral });
        }

        const sureMs = parseInt(interaction.values[0]);
        const sureLabel = {
          60000: '1 Dakika', 300000: '5 Dakika', 600000: '10 Dakika',
          1800000: '30 Dakika', 3600000: '1 Saat', 10800000: '3 Saat',
          21600000: '6 Saat', 43200000: '12 Saat', 86400000: '1 Gun',
          259200000: '3 Gun', 604800000: '7 Gun', 2419200000: '28 Gun',
        }[sureMs] || `${sureMs}ms`;

        const target = await interaction.guild.members.fetch(targetId).catch(() => null);
        if (!target) return interaction.reply({ content: 'Kullanici bulunamadi.', flags: MessageFlags.Ephemeral });

        await target.timeout(sureMs, reason).catch(() => {});

        const { puanEkle } = require('../global/utils/cezaPuanHelper');
        const { yeniPuan, tetiklenen } = await puanEkle(interaction.guild, target, 'mute', moderatorId, reason);

        const cfg = await StaffConfig.findOne({ guildId: interaction.guild.id });
        if (cfg?.logKanali) {
          const logKanal = interaction.guild.channels.cache.get(cfg.logKanali);
          if (logKanal) {
            logKanal.send(
              `**Mute** | <@${target.id}> (${target.user.tag})\n` +
              `> Moderator  : <@${moderatorId}>\n` +
              `> Sure       : ${sureLabel}\n` +
              `> Sebep      : ${reason}\n` +
              `> Ceza Puani : ${yeniPuan}${tetiklenen ? `\n> Tetiklendi : ${tetiklenen}` : ''}`
            ).catch(() => {});
          }
        }

        await target.send(`**${interaction.guild.name}** sunucusunda susturuldun.\n> Sure: ${sureLabel}\n> Sebep: ${reason}\n> Ceza puanin: ${yeniPuan}`).catch(() => {});

        const { ContainerBuilder: CB, TextDisplayBuilder: TDB, MessageFlags: MF } = require('discord.js');
        const updated = new CB();
        updated.addTextDisplayComponents(
          new TDB().setContent(
            `**Mute Uygulandi**\n` +
            `> Kullanici  : <@${target.id}>\n` +
            `> Sure       : ${sureLabel}\n` +
            `> Sebep      : ${reason}\n` +
            `> Ceza Puani : ${yeniPuan}${tetiklenen ? `\n> Tetiklendi : ${tetiklenen}` : ''}`
          )
        );
        return interaction.update({ components: [updated], flags: MF.IsComponentsV2 });
      }

      if (id === 'basvuru_alan_sec') {
        const alan = interaction.values[0];
        const ALAN_LABELS = {
          chat: 'Chat', ban_jail: 'Ban / Jail', mute: 'Mute',
          yetkili_alim: 'Yetkili Alim', rol_denetim: 'Rol Denetim',
          register: 'Register', streamer: 'Streamer', konser: 'Konser',
          sorun_cozme: 'Sorun Cozme', etkinlik: 'Etkinlik', public: 'Public',
        };

        const modal = new ModalBuilder()
          .setCustomId(`basvuru_modal_${alan}`)
          .setTitle(`${ALAN_LABELS[alan]} Basvurusu`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('yas')
              .setLabel('Yasiniz')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(3)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('tecrube')
              .setLabel('Bu alandaki tecrübeniz')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(500)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('neden')
              .setLabel('Neden bu gorevi almak istiyorsunuz?')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(500)
          ),
        );

        return interaction.showModal(modal);
      }

      
      if (id === 'kp_menu') {
        const value = interaction.values[0];
        const userId  = interaction.user.id;
        const guildId = interaction.guild.id;
        const member  = interaction.member;

        const container = new ContainerBuilder();

        if (value === 'kp_stat') {
          const stat = await Stat.findOne({ guildId, userId }).catch(() => null);
          const allStats = await Stat.find({ guildId }).lean().catch(() => []);
          const mesajSira = [...allStats].sort((a, b) => (b.mesaj ?? 0) - (a.mesaj ?? 0)).findIndex(s => s.userId === userId) + 1;
          const sesSira   = [...allStats].sort((a, b) => (b.ses ?? 0) - (a.ses ?? 0)).findIndex(s => s.userId === userId) + 1;
          const davetSira = [...allStats].sort((a, b) => (b.invite ?? 0) - (a.invite ?? 0)).findIndex(s => s.userId === userId) + 1;
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Level & Istatistik\n` +
              `Mevcut aktiflik verileriniz sistem tarafindan analiz edildi:\n\n` +
              `> **Mesaj Sayisi** : **${stat?.mesaj ?? 0}** (Sira: #${mesajSira || '?'})\n` +
              `> **Ses Suresi**   : **${stat?.ses ?? 0}** dk (Sira: #${sesSira || '?'})\n` +
              `> **Davet**        : **${stat?.invite ?? 0}** (Sira: #${davetSira || '?'})\n` +
              `> **Davet Kullan.**:  **${stat?.inviteKullanilan ?? 0}**\n\n` +
              `*Aktif kalarak siralamada yukselmeye devam edebilirsin.*`
            )
          );
        }

        if (value === 'kp_ceza') {
          const [warns, puanDoc, cfg] = await Promise.all([
            Warn.find({ guildId, userId }).sort({ createdAt: -1 }).limit(5),
            puanGetir(guildId, userId),
            StaffConfig.findOne({ guildId }),
          ]);
          const puan = puanDoc?.puan ?? 0;
          const muteBitis = member.communicationDisabledUntilTimestamp;
          const muteKalan = muteBitis && muteBitis > Date.now() ? muteBitis - Date.now() : null;
          const jailVar = cfg?.ceza_rolu && member.roles.cache.has(cfg.ceza_rolu);
          function fmtMs(ms) {
            const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
            return [d && `${d}g`, h && `${h}s`, m && `${m}d`].filter(Boolean).join(' ') || `${s % 60}sn`;
          }
          const aktif = [];
          if (muteKalan) aktif.push(`> Mute — Kalan: **${fmtMs(muteKalan)}** (<t:${Math.floor(muteBitis / 1000)}:R>)`);
          if (jailVar) aktif.push('> Jail — Aktif');
          if (!aktif.length) aktif.push('> Aktif ceza yok.');
          const warnLines = warns.length
            ? warns.map((w, i) => `> **${i + 1}.** <@${w.moderator}> — ${w.reason} *(${new Date(w.createdAt).toLocaleDateString('tr-TR')})*`).join('\n')
            : '> Uyari gecmisi yok.';
          const sonrakiEsik = ESIKLER.slice().reverse().find(e => puan < e.puan);
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Ceza Kayitlarim\n` +
              `Toplam **${warns.length}** uyari kaydınız bulunmakta.\n\n` +
              `> **Ceza Puani**: **${puan}** / 100\n\n` +
              `**Aktif Cezalar**\n${aktif.join('\n')}\n\n` +
              (sonrakiEsik ? `> Sonraki esik: **${sonrakiEsik.label}** — ${sonrakiEsik.puan - puan}p kaldi\n\n` : '') +
              `**Son 5 Uyari**\n${warnLines}`
            )
          );
        }

        if (value === 'kp_sicil') {
          const gecmis = await gecmisGetir(guildId, userId, 10);
          const TIP_LABEL = {
            warn: 'Uyari', mute: 'Mute', voicemute: 'Ses Mute', jail: 'Jail', ban: 'Ban',
            unwarn: 'Uyari Silindi', unmute: 'Mute Kaldirildi', unvoicemute: 'Ses Mute Kaldirildi',
            unjail: 'Jail Kaldirildi', unban: 'Ban Kaldirildi',
          };
          const lines = gecmis.length
            ? gecmis.map(k => {
                const mod = k.moderator === 'AUTO' ? 'Otomatik' : `<@${k.moderator}>`;
                return `> **${TIP_LABEL[k.tip] || k.tip}** — ${k.reason} | ${mod} *(${new Date(k.createdAt).toLocaleDateString('tr-TR')})*`;
              }).join('\n')
            : '> Sicil kaydi yok.';
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Sicilim (son 10)\n${lines}`)
          );
        }

        if (value === 'kp_siralama') {
          const allStats = await Stat.find({ guildId }).lean().catch(() => []);
          const stat = allStats.find(s => s.userId === userId);
          const mesajSira = [...allStats].sort((a, b) => (b.mesaj ?? 0) - (a.mesaj ?? 0)).findIndex(s => s.userId === userId) + 1;
          const sesSira   = [...allStats].sort((a, b) => (b.ses ?? 0) - (a.ses ?? 0)).findIndex(s => s.userId === userId) + 1;
          const davetSira = [...allStats].sort((a, b) => (b.invite ?? 0) - (a.invite ?? 0)).findIndex(s => s.userId === userId) + 1;
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Siralamam (${allStats.length} kisi icinde)\n` +
              `> Mesaj : #**${mesajSira || '?'}** (${stat?.mesaj ?? 0} mesaj)\n` +
              `> Ses   : #**${sesSira || '?'}** (${stat?.ses ?? 0} dk)\n` +
              `> Davet : #**${davetSira || '?'}** (${stat?.invite ?? 0} davet)`
            )
          );
        }

        if (value === 'kp_roller') {
          const roller = member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => `<@&${r.id}>`)
            .join(', ') || 'Hic rol yok.';
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Rol & Yetkilerim (${member.roles.cache.size - 1} rol)\n> ${roller}`
            )
          );
        }

        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
      }

      const SINGLE_CATS = ['rm_takim', 'rm_renk', 'rm_iliski', 'rm_burc'];
      const MULTI_CATS  = ['rm_oyun'];

      if (SINGLE_CATS.includes(id)) {
        const cfg = await RoleMenuConfig.findOne({ guildId: interaction.guild.id });
        if (!cfg) return interaction.reply({ content: 'Rol menusu ayarlanmamis.', flags: MessageFlags.Ephemeral });

        const catKey = id.replace('rm_', '');
        const allRoles = cfg[catKey] || [];
        const selected = interaction.values[0];
        const member = interaction.member;

        
        for (const rid of allRoles) {
          if (rid !== selected && member.roles.cache.has(rid)) {
            await member.roles.remove(rid).catch(() => {});
          }
        }

        if (member.roles.cache.has(selected)) {
          await member.roles.remove(selected).catch(() => {});
          return interaction.reply({ content: `Rol kaldirildi: <@&${selected}>`, flags: MessageFlags.Ephemeral });
        } else {
          await member.roles.add(selected).catch(() => {});
          return interaction.reply({ content: `Rol verildi: <@&${selected}>`, flags: MessageFlags.Ephemeral });
        }
      }

      if (MULTI_CATS.includes(id)) {
        const cfg = await RoleMenuConfig.findOne({ guildId: interaction.guild.id });
        if (!cfg) return interaction.reply({ content: 'Rol menusu ayarlanmamis.', flags: MessageFlags.Ephemeral });

        const catKey = id.replace('rm_', '');
        const allRoles = cfg[catKey] || [];
        const selected = interaction.values;
        const member = interaction.member;
        const added = [], removed = [];

        for (const rid of allRoles) {
          if (selected.includes(rid)) {
            if (!member.roles.cache.has(rid)) { await member.roles.add(rid).catch(() => {}); added.push(rid); }
          } else {
            if (member.roles.cache.has(rid)) { await member.roles.remove(rid).catch(() => {}); removed.push(rid); }
          }
        }

        const lines = [];
        if (added.length)   lines.push(`Eklendi: ${added.map(r => `<@&${r}>`).join(', ')}`);
        if (removed.length) lines.push(`Kaldirildi: ${removed.map(r => `<@&${r}>`).join(', ')}`);
        return interaction.reply({ content: lines.join('\n') || 'Degisiklik yapilmadi.', flags: MessageFlags.Ephemeral });
      }
    }

    
    if (interaction.isModalSubmit()) {

      
      if (interaction.customId.startsWith('setup_slb_save_')) {
        const cat = interaction.customId.replace('setup_slb_save_', '');
        const parentAdi = interaction.fields.getTextInputValue('parent_adi').trim();
        const StreamerLbConfig = require('../global/models/StreamerLbConfig');
        await StreamerLbConfig.findOneAndUpdate(
          { guildId: interaction.guild.id },
          { [cat]: parentAdi },
          { upsert: true }
        );
        return interaction.reply({ content: `**${cat}** kategorisi için parent adı \`${parentAdi}\` olarak kaydedildi.`, flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId === 'ozel_limit_modal' || interaction.customId === 'ozel_ad_modal') {
        const { handleOzelOdaModal } = require('../Commands/BotOwner/ozeloda-kur');
        return handleOzelOdaModal(interaction);
      }

      
      if (interaction.customId.startsWith('lb_modal_')) {
        const parts = interaction.customId.split('_');
        
        const TIPLER_SET = new Set(['mesaj', 'ses', 'kamera', 'yayin', 'invite']);
        const tipInput = (interaction.fields.getTextInputValue('tip') || '').toLowerCase().trim();
        const gunInput = parseInt(interaction.fields.getTextInputValue('gun')) || 0;
        const tip = TIPLER_SET.has(tipInput) ? tipInput : (TIPLER_SET.has(parts[2]) ? parts[2] : null);
        const gun = [1, 7, 30].includes(gunInput) ? gunInput : 0;
        const { buildLeaderboard } = require('../Commands/Istatistik/leaderboard');
        await interaction.guild.members.fetch().catch(() => {});
        const container = await buildLeaderboard(interaction.guild, tip, gun);
        return interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }

      if (interaction.customId === 'kp_modal_istek' || interaction.customId === 'kp_modal_oneri' || interaction.customId === 'kp_modal_sikayet') {
        const tip = interaction.customId.replace('kp_modal_', '');
        const tipLabel = { istek: 'Istek', oneri: 'Oneri', sikayet: 'Sikayet' }[tip] || 'Bildirim';
        const metin = interaction.fields.getTextInputValue('metin') || '';
        await interaction.reply({ content: 'Bildiriminiz basariyla iletildi!', flags: MessageFlags.Ephemeral });
        const cfg = await StaffConfig.findOne({ guildId: interaction.guild.id });
        const logKanal = cfg?.logKanali ? interaction.guild.channels.cache.get(cfg.logKanali) : null;
        const hedef = logKanal || interaction.channel;
        if (hedef) {
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Yeni Bir ${tipLabel}!\n` +
              `> **Gonderen** : <@${interaction.user.id}> (\`${interaction.user.id}\`)\n` +
              `> **Icerik**   : ${metin}\n` +
              `> **Tarih**    : <t:${Math.floor(Date.now() / 1000)}:R>`
            )
          );
          hedef.send({ components: [container], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } }).catch(() => {});
        }
        return;
      }

      if (interaction.customId.startsWith('tweet_yorum_modal_')) {
        const tweetId = interaction.customId.replace('tweet_yorum_modal_', '');
        const tweet = await Tweet.findOne({ tweetId });
        if (!tweet) return interaction.reply({ content: 'Tweet bulunamadi.', flags: MessageFlags.Ephemeral });
        const content = interaction.fields.getTextInputValue('yorum_input');
        tweet.comments.push({
          userId: interaction.user.id,
          username: interaction.user.username,
          content,
        });
        await tweet.save();
        return interaction.reply({ content: 'Yorumun eklendi.', flags: MessageFlags.Ephemeral });
      }

      
      if (interaction.customId === 'yetkili_modal') {
        const cfg = await StaffConfig.findOne({ guildId: interaction.guild.id });
        if (!cfg?.yetkiliKanali) return interaction.reply({ content: 'Yetkili basvuru kanali ayarlanmamis.', flags: MessageFlags.Ephemeral });

        const existing = await YetkiliApplication.findOne({ guildId: interaction.guild.id, userId: interaction.user.id, status: 'bekliyor' });
        if (existing) return interaction.reply({ content: 'Zaten bekleyen bir yetkili basvurun var.', flags: MessageFlags.Ephemeral });

        const app = await YetkiliApplication.create({
          guildId:   interaction.guild.id,
          userId:    interaction.user.id,
          yas:       interaction.fields.getTextInputValue('yas'),
          tecrube:   interaction.fields.getTextInputValue('tecrube'),
          saat:      interaction.fields.getTextInputValue('saat'),
          neden:     interaction.fields.getTextInputValue('neden'),
          channelId: cfg.yetkiliKanali,
        });

        const kanal = interaction.guild.channels.cache.get(cfg.yetkiliKanali);
        if (!kanal) return interaction.reply({ content: 'Basvuru kanali bulunamadi.', flags: MessageFlags.Ephemeral });

        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        const appContainer = new ContainerBuilder();
        appContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Yeni Yetkili Başvurusu\n` +
            `> Kullanıcı : <@${app.userId}> (${member?.user?.tag || app.userId})\n` +
            `> Yaş       : ${app.yas}\n` +
            `> Tecrübe   : ${app.tecrube}\n` +
            `> Saat      : ${app.saat}\n` +
            `> Neden     : ${app.neden}`
          )
        );
        appContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        appContainer.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`yetkili_kabul_${app._id}`).setLabel('Kabul Et').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`yetkili_red_${app._id}`).setLabel('Reddet').setStyle(ButtonStyle.Danger),
          )
        );

        const msg = await kanal.send({ components: [appContainer], flags: MessageFlags.IsComponentsV2 });
        app.messageId = msg.id;
        await app.save();
        return interaction.reply({ content: 'Yetkili basvurun alindi!', flags: MessageFlags.Ephemeral });
      }

      
      if (interaction.customId === 'streamer_modal') {
        const cfg = await StaffConfig.findOne({ guildId: interaction.guild.id });
        if (!cfg?.streamerKanali) return interaction.reply({ content: 'Streamer basvuru kanali ayarlanmamis.', flags: MessageFlags.Ephemeral });

        const existing = await StreamerApplication.findOne({ guildId: interaction.guild.id, userId: interaction.user.id, status: 'bekliyor' });
        if (existing) return interaction.reply({ content: 'Zaten bekleyen bir streamer basvurun var.', flags: MessageFlags.Ephemeral });

        const app = await StreamerApplication.create({
          guildId:   interaction.guild.id,
          userId:    interaction.user.id,
          platform:  interaction.fields.getTextInputValue('platform'),
          kanal:     interaction.fields.getTextInputValue('kanal'),
          icerik:    interaction.fields.getTextInputValue('icerik'),
          izleyici:  interaction.fields.getTextInputValue('izleyici'),
          neden:     interaction.fields.getTextInputValue('neden'),
          channelId: cfg.streamerKanali,
        });

        const kanal = interaction.guild.channels.cache.get(cfg.streamerKanali);
        if (!kanal) return interaction.reply({ content: 'Basvuru kanali bulunamadi.', flags: MessageFlags.Ephemeral });

        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        const appContainer = new ContainerBuilder();
        appContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Yeni Streamer Başvurusu\n` +
            `> Kullanıcı : <@${app.userId}> (${member?.user?.tag || app.userId})\n` +
            `> Platform  : ${app.platform}\n` +
            `> Kanal     : ${app.kanal}\n` +
            `> İçerik    : ${app.icerik}\n` +
            `> İzleyici  : ${app.izleyici}\n` +
            `> Neden     : ${app.neden}`
          )
        );
        appContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        appContainer.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`streamer_kabul_${app._id}`).setLabel('Kabul Et').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`streamer_red_${app._id}`).setLabel('Reddet').setStyle(ButtonStyle.Danger),
          )
        );

        const msg = await kanal.send({ components: [appContainer], flags: MessageFlags.IsComponentsV2 });
        app.messageId = msg.id;
        await app.save();
        return interaction.reply({ content: 'Streamer basvurun alindi!', flags: MessageFlags.Ephemeral });
      }

      
      if (interaction.customId === 'sorun_modal') {
        const cfg = await StaffConfig.findOne({ guildId: interaction.guild.id });
        if (!cfg?.sorunKanali) return interaction.reply({ content: 'Sorun cozme kanali ayarlanmamis.', flags: MessageFlags.Ephemeral });

        const app = await SorunApplication.create({
          guildId:   interaction.guild.id,
          userId:    interaction.user.id,
          sorun:     interaction.fields.getTextInputValue('sorun'),
          hedef:     interaction.fields.getTextInputValue('hedef'),
          neden:     interaction.fields.getTextInputValue('neden') || '-',
          channelId: cfg.sorunKanali,
        });

        const kanal = interaction.guild.channels.cache.get(cfg.sorunKanali);
        if (!kanal) return interaction.reply({ content: 'Sorun kanali bulunamadi.', flags: MessageFlags.Ephemeral });

        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        const appContainer = new ContainerBuilder();
        appContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Yeni Sorun Bildirimi\n` +
            `> Kullanıcı  : <@${app.userId}> (${member?.user?.tag || app.userId})\n` +
            `> Sorun      : ${app.sorun}\n` +
            `> Hedef      : ${app.hedef}\n` +
            `> Açıklama   : ${app.neden}`
          )
        );
        appContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        appContainer.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`sorun_cozuldu_${app._id}`).setLabel('Cozuldu').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`sorun_red_${app._id}`).setLabel('Gecersiz').setStyle(ButtonStyle.Danger),
          )
        );

        const msg = await kanal.send({ components: [appContainer], flags: MessageFlags.IsComponentsV2 });
        app.messageId = msg.id;
        await app.save();
        return interaction.reply({ content: 'Sorunun bildirildi! Ekibimiz en kisa surede ilgilenecek.', flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId === 'confession_modal') {
        const cfg = await ConfessionConfig.findOne({ guildId: interaction.guild.id });
        if (!cfg?.channelId) {
          return interaction.reply({ content: 'Itiraf kanali henuz ayarlanmamis.', flags: MessageFlags.Ephemeral });
        }

        const channel = interaction.guild.channels.cache.get(cfg.channelId);
        if (!channel) {
          return interaction.reply({ content: 'Itiraf kanali bulunamadi.', flags: MessageFlags.Ephemeral });
        }

        const content = interaction.fields.getTextInputValue('confession_input');

        if (containsProfanity(content)) {
          return interaction.reply({ content: 'Itirafin kufurlu icerik iceriyor, gonderilemedi.', flags: MessageFlags.Ephemeral });
        }

        const confNum = Date.now();

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## Anonim İtiraf')
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`> ${content}`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`> \`#${confNum}\`  ·  Anonim`)
        );

        const roleMention = cfg.roleId ? `<@&${cfg.roleId}> ` : '';
        await channel.send({
          content: roleMention || undefined,
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });

        return interaction.reply({ content: 'Itirafin anonim olarak gonderildi.', flags: MessageFlags.Ephemeral });
      }

      
      if (interaction.customId.startsWith('basvuru_modal_')) {
        const alan = interaction.customId.replace('basvuru_modal_', '');
        const cfg = await StaffConfig.findOne({ guildId: interaction.guild.id });

        if (!cfg?.basvuruKanali) {
          return interaction.reply({ content: 'Basvuru kanali henuz ayarlanmamis.', flags: MessageFlags.Ephemeral });
        }

        const existing = await StaffApplication.findOne({
          guildId: interaction.guild.id,
          userId: interaction.user.id,
          alan,
          status: 'bekliyor',
        });
        if (existing) {
          return interaction.reply({ content: 'Bu alan icin zaten bekleyen bir basvurun var.', flags: MessageFlags.Ephemeral });
        }

        const ALAN_LABELS = {
          chat: 'Chat', ban_jail: 'Ban / Jail', mute: 'Mute',
          yetkili_alim: 'Yetkili Alim', rol_denetim: 'Rol Denetim',
          register: 'Register', streamer: 'Streamer', konser: 'Konser',
          sorun_cozme: 'Sorun Cozme', etkinlik: 'Etkinlik', public: 'Public',
        };

        const app = await StaffApplication.create({
          guildId:   interaction.guild.id,
          userId:    interaction.user.id,
          alan,
          yas:       interaction.fields.getTextInputValue('yas'),
          tecrube:   interaction.fields.getTextInputValue('tecrube'),
          neden:     interaction.fields.getTextInputValue('neden'),
          channelId: cfg.basvuruKanali,
        });

        const basvuruKanali = interaction.guild.channels.cache.get(cfg.basvuruKanali);
        if (!basvuruKanali) {
          return interaction.reply({ content: 'Basvuru kanali bulunamadi.', flags: MessageFlags.Ephemeral });
        }

        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);

        const appContainer = new ContainerBuilder();
        appContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Yeni Sorumluluk Başvurusu\n` +
            `> Kullanıcı  : <@${app.userId}> (${member?.user?.tag || app.userId})\n` +
            `> Alan       : **${ALAN_LABELS[app.alan] || app.alan}**\n` +
            `> Yaş        : ${app.yas}\n` +
            `> Tecrübe    : ${app.tecrube}\n` +
            `> Neden      : ${app.neden}`
          )
        );
        appContainer.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );
        appContainer.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`basvuru_kabul_${app._id}`)
              .setLabel('Kabul Et')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`basvuru_red_${app._id}`)
              .setLabel('Reddet')
              .setStyle(ButtonStyle.Danger),
          )
        );

        const appMsg = await basvuruKanali.send({
          components: [appContainer],
          flags: MessageFlags.IsComponentsV2,
        });

        app.messageId = appMsg.id;
        await app.save();

        return interaction.reply({ content: 'Basvurun alindi! Liderler inceleyecek.', flags: MessageFlags.Ephemeral });
      }
    }

    
    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id.startsWith('basvuru_kabul_') || id.startsWith('basvuru_red_')) {
        const isKabul = id.startsWith('basvuru_kabul_');
        const appId   = id.replace(isKabul ? 'basvuru_kabul_' : 'basvuru_red_', '');

        const app = await StaffApplication.findById(appId).catch(() => null);
        if (!app || app.status !== 'bekliyor') {
          return interaction.reply({ content: 'Bu basvuru artik gecerli degil.', flags: MessageFlags.Ephemeral });
        }

        const cfg = await StaffConfig.findOne({ guildId: interaction.guild.id });
        if (!cfg) return interaction.reply({ content: 'Sorumluluk ayarlari bulunamadi.', flags: MessageFlags.Ephemeral });

        const alan = cfg[app.alan];
        const liderIds = alan?.lider || [];
        const isLider = liderIds.some(rid => interaction.member.roles.cache.has(rid)) ||
                        interaction.user.id === settings.ownerID ||
                        interaction.member.permissions.has('ManageGuild');

        if (!isLider) {
          return interaction.reply({ content: 'Bu islemi yapmak icin lider rolune sahip olmalisin.', flags: MessageFlags.Ephemeral });
        }

        app.status = isKabul ? 'kabul' : 'red';
        await app.save();

        const ALAN_LABELS = {
          chat: 'Chat', ban_jail: 'Ban / Jail', mute: 'Mute',
          yetkili_alim: 'Yetkili Alim', rol_denetim: 'Rol Denetim',
          register: 'Register', streamer: 'Streamer', konser: 'Konser',
          sorun_cozme: 'Sorun Cozme', etkinlik: 'Etkinlik', public: 'Public',
        };

        const applicant = await interaction.guild.members.fetch(app.userId).catch(() => null);

        if (isKabul && applicant) {
          const sorumlulukIds = alan?.sorumluluk || [];
          for (const rid of sorumlulukIds) {
            await applicant.roles.add(rid).catch(() => {});
          }
        }

        const updated = new ContainerBuilder();
        updated.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**${isKabul ? 'Kabul Edildi' : 'Reddedildi'}**\n` +
            `> Kullanici : <@${app.userId}>\n` +
            `> Alan      : **${ALAN_LABELS[app.alan] || app.alan}**\n` +
            `> Islem     : ${interaction.user.tag} tarafindan ${isKabul ? 'kabul edildi' : 'reddedildi'}`
          )
        );
        await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 });

        if (applicant) {
          await applicant.send(
            isKabul
              ? `Sunucudaki **${ALAN_LABELS[app.alan]}** sorumluluk basvurun kabul edildi! Sorumlu rolu verildi.`
              : `Sunucudaki **${ALAN_LABELS[app.alan]}** sorumluluk basvurun reddedildi.`
          ).catch(() => {});
        }
        return;
      }

      
      if (id.startsWith('yetkili_kabul_') || id.startsWith('yetkili_red_')) {
        const isKabul = id.startsWith('yetkili_kabul_');
        const appId   = id.replace(isKabul ? 'yetkili_kabul_' : 'yetkili_red_', '');

        const isYetkili = interaction.user.id === settings.ownerID || interaction.member.permissions.has('ManageGuild');
        if (!isYetkili) return interaction.reply({ content: 'Bu islemi yapmak icin yetkin yok.', flags: MessageFlags.Ephemeral });

        const app = await YetkiliApplication.findById(appId).catch(() => null);
        if (!app || app.status !== 'bekliyor') return interaction.reply({ content: 'Bu basvuru artik gecerli degil.', flags: MessageFlags.Ephemeral });

        app.status = isKabul ? 'kabul' : 'red';
        await app.save();

        const updated = new ContainerBuilder();
        updated.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**${isKabul ? 'Kabul Edildi' : 'Reddedildi'}**\n` +
            `> Kullanici : <@${app.userId}>\n` +
            `> Islem     : ${interaction.user.tag} tarafindan ${isKabul ? 'kabul edildi' : 'reddedildi'}`
          )
        );
        await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 });

        const applicant = await interaction.guild.members.fetch(app.userId).catch(() => null);
        if (applicant) {
          await applicant.send(
            isKabul ? 'Yetkili basvurun kabul edildi! Hosgeldin.' : 'Yetkili basvurun reddedildi.'
          ).catch(() => {});
        }
        return;
      }

      
      if (id.startsWith('streamer_kabul_') || id.startsWith('streamer_red_')) {
        const isKabul = id.startsWith('streamer_kabul_');
        const appId   = id.replace(isKabul ? 'streamer_kabul_' : 'streamer_red_', '');

        const cfg = await StaffConfig.findOne({ guildId: interaction.guild.id });
        const streamerLiderIds = cfg?.streamer?.lider || [];
        const isYetkili = streamerLiderIds.some(rid => interaction.member.roles.cache.has(rid)) ||
                          interaction.user.id === settings.ownerID ||
                          interaction.member.permissions.has('ManageGuild');
        if (!isYetkili) return interaction.reply({ content: 'Bu islemi yapmak icin streamer lider rolune sahip olmalisin.', flags: MessageFlags.Ephemeral });

        const app = await StreamerApplication.findById(appId).catch(() => null);
        if (!app || app.status !== 'bekliyor') return interaction.reply({ content: 'Bu basvuru artik gecerli degil.', flags: MessageFlags.Ephemeral });

        app.status = isKabul ? 'kabul' : 'red';
        await app.save();

        if (isKabul) {
          const sorumlulukIds = cfg?.streamer?.sorumluluk || [];
          const applicant = await interaction.guild.members.fetch(app.userId).catch(() => null);
          if (applicant) {
            for (const rid of sorumlulukIds) await applicant.roles.add(rid).catch(() => {});
          }
        }

        const updated = new ContainerBuilder();
        updated.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**${isKabul ? 'Kabul Edildi' : 'Reddedildi'}**\n` +
            `> Kullanici : <@${app.userId}>\n` +
            `> Islem     : ${interaction.user.tag} tarafindan ${isKabul ? 'kabul edildi' : 'reddedildi'}`
          )
        );
        await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 });

        const applicant = await interaction.guild.members.fetch(app.userId).catch(() => null);
        if (applicant) {
          await applicant.send(
            isKabul ? 'Streamer basvurun kabul edildi! Streamer rolun verildi.' : 'Streamer basvurun reddedildi.'
          ).catch(() => {});
        }
        return;
      }

      
      if (id.startsWith('sorun_cozuldu_') || id.startsWith('sorun_red_')) {
        const isCozuldu = id.startsWith('sorun_cozuldu_');
        const appId     = id.replace(isCozuldu ? 'sorun_cozuldu_' : 'sorun_red_', '');

        const cfg = await StaffConfig.findOne({ guildId: interaction.guild.id });
        const sorunLiderIds = cfg?.sorun_cozme?.lider || [];
        const sorunDenetimIds = cfg?.sorun_cozme?.denetim || [];
        const isYetkili = [...sorunLiderIds, ...sorunDenetimIds].some(rid => interaction.member.roles.cache.has(rid)) ||
                          interaction.user.id === settings.ownerID ||
                          interaction.member.permissions.has('ManageGuild');
        if (!isYetkili) return interaction.reply({ content: 'Bu islemi yapmak icin sorun cozme rolune sahip olmalisin.', flags: MessageFlags.Ephemeral });

        const app = await SorunApplication.findById(appId).catch(() => null);
        if (!app || app.status !== 'bekliyor') return interaction.reply({ content: 'Bu bildirim artik gecerli degil.', flags: MessageFlags.Ephemeral });

        app.status = isCozuldu ? 'cozuldu' : 'gecersiz';
        await app.save();

        const updated = new ContainerBuilder();
        updated.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**${isCozuldu ? 'Cozuldu' : 'Gecersiz'}**\n` +
            `> Kullanici : <@${app.userId}>\n` +
            `> Islem     : ${interaction.user.tag} tarafindan ${isCozuldu ? 'cozuldu olarak isaretlendi' : 'gecersiz sayildi'}`
          )
        );
        await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 });

        const applicant = await interaction.guild.members.fetch(app.userId).catch(() => null);
        if (applicant) {
          await applicant.send(
            isCozuldu ? 'Bildirdigin sorun cozuldu olarak isaretlendi.' : 'Bildirdigin sorun gecersiz sayildi.'
          ).catch(() => {});
        }
        return;
      }

    }
  },
};
