const RoleMenuConfig = require('../../global/models/RoleMenuConfig');
const settings = require('../../global/settings/settings.json');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');

function hasPerms(message) {
  return (
    message.author.id === settings.ownerID ||
    message.member.permissions.has('ManageGuild')
  );
}

function roleName(guild, id) {
  return guild.roles.cache.get(id)?.name || id;
}

function sep(container) {
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
}

function buildPanel(cfg, guild) {
  const e = cfg.etkinlik || {};
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '## Rol Seçim Menüsü\n' +
      'Aşağıdan istediğin rolleri alabilirsin.\n' +
      'Etkinlik rollerini butonlarla, diğer rolleri menülerden seçebilirsin.'
    )
  );

  
  sep(container);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('**Etkinlik Rolleri**\n> Bildirim almak istediğin etkinlik türünü seç. Tekrar basarak rolü kaldırabilirsin.')
  );

  const etkinlikBtns = [];
  if (e.cekilis)  etkinlikBtns.push(new ButtonBuilder().setCustomId(`rm_etkinlik_${e.cekilis}`).setLabel('Cekilis Duyurusu').setStyle(ButtonStyle.Success));
  if (e.etkinlik) etkinlikBtns.push(new ButtonBuilder().setCustomId(`rm_etkinlik_${e.etkinlik}`).setLabel('Etkinlik Duyurusu').setStyle(ButtonStyle.Success));
  if (e.coin)     etkinlikBtns.push(new ButtonBuilder().setCustomId(`rm_etkinlik_${e.coin}`).setLabel('Coin Bildirim').setStyle(ButtonStyle.Success));
  if (e.sosyal)   etkinlikBtns.push(new ButtonBuilder().setCustomId(`rm_etkinlik_${e.sosyal}`).setLabel('Sosyal Etkinlik').setStyle(ButtonStyle.Success));

  if (etkinlikBtns.length > 0)
    container.addActionRowComponents(new ActionRowBuilder().addComponents(...etkinlikBtns.slice(0, 5)));

  
  if (cfg.takim?.length > 0) {
    sep(container);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Takım Rolleri**\n> Desteklediğin takımı seç. Tekrar seçince rol kalkar.')
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('rm_takim')
          .setPlaceholder('Takim rolunu sec...')
          .addOptions(cfg.takim.map(id => ({ label: roleName(guild, id), value: id })))
      )
    );
  }

  
  if (cfg.renk?.length > 0) {
    sep(container);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Renk Rolleri**\n> Renk rolünü seç. Önceki renk rolü otomatik kalkar.')
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('rm_renk')
          .setPlaceholder('Renk rolunu sec...')
          .addOptions(cfg.renk.map(id => ({ label: roleName(guild, id), value: id })))
      )
    );
  }

  
  if (cfg.iliski?.length > 0) {
    sep(container);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**İlişki Rolleri**\n> İlişki durumunu seç. Tekrar seçince rol kalkar.')
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('rm_iliski')
          .setPlaceholder('Iliski rolunu sec...')
          .addOptions(cfg.iliski.map(id => ({ label: roleName(guild, id), value: id })))
      )
    );
  }

  
  if (cfg.oyun?.length > 0) {
    sep(container);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Oyun Rolleri**\n> Oynadığın oyunları seç (çoklu seçim yapabilirsin).')
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('rm_oyun')
          .setPlaceholder('Oyun rollarini sec...')
          .setMinValues(1)
          .setMaxValues(Math.min(cfg.oyun.length, 5))
          .addOptions(cfg.oyun.map(id => ({ label: roleName(guild, id), value: id })))
      )
    );
  }

  
  if (cfg.burc?.length > 0) {
    sep(container);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Burç Rolleri**\n> Burcunu seç. Tekrar seçince rol kalkar.')
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('rm_burc')
          .setPlaceholder('Burc rolunu sec...')
          .addOptions(cfg.burc.map(id => ({ label: roleName(guild, id), value: id })))
      )
    );
  }

  return container;
}

module.exports = {
  name: 'rolmenu',
  description: 'Rol secim panelini gonderir.',
  usage: '.rolmenu [#kanal]',
  aliases: [],
  category: 'BotOwner',

  async execute(message, args, _focus) {
    if (!hasPerms(message)) return message.reply('Yetkiniz yok.');

    const cfg = await RoleMenuConfig.findOne({ guildId: message.guild.id });
    if (!cfg) return message.reply('Once `.setup` ile rol menusu rollerini ayarlayin.');

    const target = message.mentions.channels.first() || message.channel;
    const panel = buildPanel(cfg, message.guild);
    await target.send({ components: [panel], flags: MessageFlags.IsComponentsV2 });
    if (target.id !== message.channel.id)
      await message.reply({ content: `Panel <#${target.id}> kanalina gonderildi.`, flags: MessageFlags.Ephemeral });
  },

  buildPanel,
};
