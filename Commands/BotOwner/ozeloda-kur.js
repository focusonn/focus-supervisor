const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const OzelOda       = require('../../global/models/OzelOda');
const OzelOdaConfig = require('../../global/models/OzelOdaConfig');
const StaffConfig   = require('../../global/models/StaffConfig');
const settings      = require('../../global/settings/settings.json');

function buildPanel(cfg) {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Ozel Oda Yonetim Paneli**\n' +
      '> Kendi ozel odani olustur ve yonet.\n\n' +
      '> Ses kanalina gir, ardından asagidaki butonlari kullan.\n' +
      '> Oda bos kaldiginda otomatik olarak silinir.'
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ozel_limit').setLabel('Sinir').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ozel_kilitle').setLabel('Kilitle').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ozel_gizle').setLabel('Gizle').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ozel_ad').setLabel('Isim').setStyle(ButtonStyle.Secondary),
    )
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ozel_kisi_ekle').setLabel('Kisi Ekle').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('ozel_kisi_cikar').setLabel('Kisi Cikar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ozel_ust').setLabel('Zirveye Tas').setStyle(ButtonStyle.Primary),
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  return container;
}

module.exports = {
  name: 'ozeloda-kur',
  aliases: ['ozelodakur', 'ozel-oda'],
  category: 'BotOwner',
  async execute(message, args, focus) {    if (message.author.id !== settings.ownerID)
      return message.reply('Bu komutu sadece bot sahibi kullanabilir.');

    const guildId = message.guild.id;

    
    const cfg = await OzelOdaConfig.findOne({ guildId }) || new OzelOdaConfig({ guildId });

    const setupContainer = new ContainerBuilder();
    setupContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**Ozel Oda Kurulum**\n' +
        `> Kategori    : \`${cfg.categoryName}\`\n` +
        `> Ses Kanali  : \`${cfg.voiceChannelName}\`\n` +
        `> Panel Kanali: \`${cfg.textChannelName}\`\n\n` +
        '> Ayarlamak icin **Ayarla**, kanalları oluşturmak icin **Kur** butonuna bas.'
      )
    );
    setupContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    setupContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('oo_ayarla').setLabel('Ayarla').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('oo_kur').setLabel('Kur').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('oo_sifirla').setLabel('Sifirla').setStyle(ButtonStyle.Danger),
      )
    );

    const sent = await message.channel.send({ components: [setupContainer], flags: MessageFlags.IsComponentsV2 });
    await message.delete().catch(() => {});

    const collector = sent.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 120000,
    });

    collector.on('collect', async i => {
      if (i.customId === 'oo_ayarla') {
        const modal = new ModalBuilder().setCustomId('oo_ayarla_modal').setTitle('Ozel Oda Ayarlari');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cat').setLabel('Kategori Adi').setStyle(TextInputStyle.Short)
              .setValue(cfg.categoryName).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('voice').setLabel('Olustur Kanali Adi').setStyle(TextInputStyle.Short)
              .setValue(cfg.voiceChannelName).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('text').setLabel('Panel Kanali Adi').setStyle(TextInputStyle.Short)
              .setValue(cfg.textChannelName).setRequired(true)
          ),
        );
        await i.showModal(modal);
        try {
          const sb = await i.awaitModalSubmit({ time: 60000 });
          cfg.categoryName     = sb.fields.getTextInputValue('cat').trim();
          cfg.voiceChannelName = sb.fields.getTextInputValue('voice').trim();
          cfg.textChannelName  = sb.fields.getTextInputValue('text').trim();
          await cfg.save();
          await sb.reply({ content: 'Ayarlar kaydedildi.', flags: MessageFlags.Ephemeral });
        } catch {}
        return;
      }

      if (i.customId === 'oo_sifirla') {
        const mevcut = await OzelOdaConfig.findOne({ guildId });
        if (mevcut) {
          
          let kategori = mevcut.categoryId
            ? message.guild.channels.cache.get(mevcut.categoryId)
            : null;

          if (!kategori && mevcut.panelChannelId) {
            const panelKanal = message.guild.channels.cache.get(mevcut.panelChannelId);
            kategori = panelKanal?.parent;
          }

          if (kategori) {
            message.guild.channels.cache
              .filter(c => c.parentId === kategori.id)
              .forEach(c => c.delete().catch(() => {}));
            await kategori.delete().catch(() => {});
          }
        }
        await OzelOdaConfig.deleteOne({ guildId });
        await OzelOda.deleteMany({ guildId });
        return i.reply({ content: 'Sistem sifirlanadi.', flags: MessageFlags.Ephemeral });
      }

      if (i.customId === 'oo_kur') {
        await i.deferUpdate();
        const latestCfg = await OzelOdaConfig.findOne({ guildId }) || cfg;
        const staffCfg  = await StaffConfig.findOne({ guildId });

        const everyoneId = message.guild.roles.everyone.id;
        const botId      = message.guild.members.me.id;

        
        const izinliRoller = [
          ...(staffCfg?.register?.sorumluluk || []),
          ...(staffCfg?.register?.denetim    || []),
          ...(staffCfg?.register?.lider      || []),
        ].filter(Boolean);

        
        let kategori = message.guild.channels.cache.find(
          c => c.type === ChannelType.GuildCategory &&
               c.name.toLowerCase() === latestCfg.categoryName.toLowerCase()
        );
        if (!kategori) {
          kategori = await message.guild.channels.create({
            name: latestCfg.categoryName,
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
              { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
              { id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers] },
              ...izinliRoller.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] })),
            ],
          }).catch(() => null);
        }
        if (!kategori) return i.followUp({ content: 'Kategori olusturulamadi.', flags: MessageFlags.Ephemeral });

        
        let panelKanal = message.guild.channels.cache.find(
          c => c.parentId === kategori.id && c.type === ChannelType.GuildText
        );
        if (!panelKanal) {
          panelKanal = await message.guild.channels.create({
            name: latestCfg.textChannelName,
            type: ChannelType.GuildText,
            parent: kategori,
            permissionOverwrites: [
              { id: everyoneId, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
              { id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
              ...izinliRoller.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel] })),
            ],
          }).catch(() => null);
        }

        
        let olusturKanal = message.guild.channels.cache.find(
          c => c.parentId === kategori.id && c.type === ChannelType.GuildVoice
        );
        if (!olusturKanal) {
          olusturKanal = await message.guild.channels.create({
            name: latestCfg.voiceChannelName,
            type: ChannelType.GuildVoice,
            parent: kategori,
            permissionOverwrites: [
              { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
              { id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.MoveMembers] },
              ...izinliRoller.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] })),
            ],
          }).catch(() => null);
        }

        
        if (panelKanal) {
          await panelKanal.send({ components: [buildPanel(latestCfg)], flags: MessageFlags.IsComponentsV2 });
          latestCfg.panelChannelId = panelKanal.id;
          latestCfg.categoryId     = kategori.id;
          if (olusturKanal) latestCfg.voiceChannelId = olusturKanal.id;
          await latestCfg.save();
        }

        return i.followUp({
          content: `Kurulum tamamlandi. Panel: ${panelKanal || 'olusturulamadi'}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    });

    collector.on('end', () => {
      sent.edit({ components: [] }).catch(() => {});
    });
  },

  async handleOzelOdaButton(interaction) {
    const id     = interaction.customId;
    const member = interaction.member;
    const guild  = interaction.guild;

    
    const vc = member?.voice?.channel;
    if (!vc) {
      return interaction.reply({ content: 'Bir ses kanalinda olmalisin!', flags: MessageFlags.Ephemeral });
    }

    
    const cfg = await OzelOdaConfig.findOne({ guildId: guild.id });
    if (!cfg) {
      return interaction.reply({ content: 'Ozel oda sistemi kurulmamis!', flags: MessageFlags.Ephemeral });
    }

    const catName   = cfg.categoryName   || 'Ozel Odalar';
    const voiceName = cfg.voiceChannelName || '+ Ozel Oda Olustur';

    
    const parent = vc.parent;
    const dogruKategori = cfg.categoryId
      ? parent?.id === cfg.categoryId
      : parent?.name?.toLowerCase() === catName.toLowerCase();

    if (!dogruKategori) {
      return interaction.reply({ content: `Bu islem sadece ${catName} kategorisinde gecerlidir!`, flags: MessageFlags.Ephemeral });
    }

    
    const olusturKanalMi = cfg.voiceChannelId
      ? vc.id === cfg.voiceChannelId
      : vc.name.toLowerCase() === voiceName.toLowerCase();

    if (olusturKanalMi) {
      return interaction.reply({ content: 'Once ozel odani olusturmalisin!', flags: MessageFlags.Ephemeral });
    }

    
    const kayit = await OzelOda.findOne({ guildId: guild.id, channelId: vc.id });
    if (!kayit) {
      return interaction.reply({ content: 'Bu kanal bir ozel oda degil veya kaydi bulunamadi!', flags: MessageFlags.Ephemeral });
    }
    if (kayit.ownerId !== interaction.user.id && settings.ownerID !== interaction.user.id) {
      return interaction.reply({ content: 'Bu islemi sadece oda sahibi yapabilir!', flags: MessageFlags.Ephemeral });
    }

    
    if (id === 'ozel_limit') {
      const modal = new ModalBuilder().setCustomId('ozel_limit_modal').setTitle('Oda Limiti');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('sayi').setLabel('Limit (0 = sinirsiz, max 99)').setStyle(TextInputStyle.Short).setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    
    if (id === 'ozel_ad') {
      const modal = new ModalBuilder().setCustomId('ozel_ad_modal').setTitle('Oda Ismi');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('ad').setLabel('Yeni Isim').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
        )
      );
      return interaction.showModal(modal);
    }

    
    if (id === 'ozel_kilitle') {
      kayit.locked = !kayit.locked;
      await kayit.save();
      await vc.permissionOverwrites.edit(guild.roles.everyone, { Connect: kayit.locked ? false : null }).catch(() => {});
      return interaction.reply({
        content: kayit.locked ? 'Oda kilitlendi.' : 'Oda kilidi acildi.',
        flags: MessageFlags.Ephemeral,
      });
    }

    
    if (id === 'ozel_gizle') {
      const ow = vc.permissionOverwrites.resolve(guild.roles.everyone.id);
      const gizli = ow ? ow.deny.has(PermissionFlagsBits.ViewChannel) : false;
      await vc.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: gizli ? null : false }).catch(() => {});
      return interaction.reply({
        content: gizli ? 'Oda artik gorunur.' : 'Oda gizlendi.',
        flags: MessageFlags.Ephemeral,
      });
    }

    
    if (id === 'ozel_kisi_ekle') {
      const select = new UserSelectMenuBuilder()
        .setCustomId('ozel_kisi_ekle_select')
        .setPlaceholder('Eklenecek kisileri sec...')
        .setMinValues(1)
        .setMaxValues(10);
      return interaction.reply({
        components: [new ActionRowBuilder().addComponents(select)],
        flags: MessageFlags.Ephemeral,
      });
    }

    
    if (id === 'ozel_kisi_cikar') {
      const options = vc.permissionOverwrites.cache
        .filter(ow => guild.members.cache.has(ow.id) && ow.id !== interaction.user.id && !guild.members.cache.get(ow.id)?.user.bot)
        .map(ow => ({ label: guild.members.cache.get(ow.id)?.displayName || 'Bilinmeyen', value: ow.id }));
      if (options.length === 0)
        return interaction.reply({ content: 'Cikarilacak kimse yok.', flags: MessageFlags.Ephemeral });
      const select = new StringSelectMenuBuilder()
        .setCustomId('ozel_kisi_cikar_select')
        .setPlaceholder('Cikarilacak kisileri sec...')
        .setMinValues(1)
        .setMaxValues(Math.min(options.length, 25))
        .addOptions(options.slice(0, 25));
      return interaction.reply({
        components: [new ActionRowBuilder().addComponents(select)],
        flags: MessageFlags.Ephemeral,
      });
    }

    
    if (id === 'ozel_ust') {
      await vc.setPosition(0).catch(() => {});
      return interaction.reply({ content: 'Oda zirveye tasindi.', flags: MessageFlags.Ephemeral });
    }
  },

  async handleOzelOdaSelect(interaction) {
    const id     = interaction.customId;
    const member = interaction.member;
    const guild  = interaction.guild;
    const vc     = member?.voice?.channel;
    if (!vc) return interaction.reply({ content: 'Bir ses kanalinda olmalisin!', flags: MessageFlags.Ephemeral });

    
    const kayit = await OzelOda.findOne({ guildId: guild.id, channelId: vc.id });
    if (!kayit) return interaction.reply({ content: 'Bu kanal bir ozel oda degil!', flags: MessageFlags.Ephemeral });
    if (kayit.ownerId !== interaction.user.id && settings.ownerID !== interaction.user.id) {
      return interaction.reply({ content: 'Bu islemi sadece oda sahibi yapabilir!', flags: MessageFlags.Ephemeral });
    }

    if (id === 'ozel_kisi_ekle_select') {
      for (const uid of interaction.values) {
        await vc.permissionOverwrites.edit(uid, { ViewChannel: true, Connect: true }).catch(() => {});
      }
      return interaction.reply({ content: 'Secilen kisiler odaya eklendi.', flags: MessageFlags.Ephemeral });
    }

    if (id === 'ozel_kisi_cikar_select') {
      for (const uid of interaction.values) {
        await vc.permissionOverwrites.delete(uid).catch(() => {});
        const hedef = guild.members.cache.get(uid);
        if (hedef?.voice?.channelId === vc.id) {
          await hedef.voice.disconnect().catch(() => {});
        }
      }
      return interaction.reply({ content: 'Secilen kisiler odadan cikarildi.', flags: MessageFlags.Ephemeral });
    }
  },

  async handleOzelOdaModal(interaction) {
    const id    = interaction.customId;
    const guild = interaction.guild;
    const vc    = interaction.member?.voice?.channel;
    if (!vc) return interaction.reply({ content: 'Bir ses kanalinda olmalisin!', flags: MessageFlags.Ephemeral });

    
    const kayit = await OzelOda.findOne({ guildId: guild.id, channelId: vc.id });
    if (!kayit) return interaction.reply({ content: 'Bu kanal bir ozel oda degil!', flags: MessageFlags.Ephemeral });
    if (kayit.ownerId !== interaction.user.id && settings.ownerID !== interaction.user.id) {
      return interaction.reply({ content: 'Bu islemi sadece oda sahibi yapabilir!', flags: MessageFlags.Ephemeral });
    }

    if (id === 'ozel_limit_modal') {
      const sayi = parseInt(interaction.fields.getTextInputValue('sayi')) || 0;
      if (sayi < 0 || sayi > 99)
        return interaction.reply({ content: 'Limit 0-99 arasinda olmali!', flags: MessageFlags.Ephemeral });
      await vc.setUserLimit(sayi).catch(() => {});
      return interaction.reply({
        content: `Oda limiti ${sayi === 0 ? 'sinirsiz' : sayi} olarak ayarlandi.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (id === 'ozel_ad_modal') {
      const yeniAd = interaction.fields.getTextInputValue('ad').trim();
      if (!yeniAd) return interaction.reply({ content: 'Gecerli bir isim gir!', flags: MessageFlags.Ephemeral });
      await vc.setName(yeniAd).catch(() => {});
      return interaction.reply({ content: `Oda adi "${yeniAd}" olarak degistirildi.`, flags: MessageFlags.Ephemeral });
    }
  },
};
