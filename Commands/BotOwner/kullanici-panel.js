const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} = require('discord.js');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'kullanici-panel',
  aliases: ['kpanel', 'kullanici-kur'],
  category: 'BotOwner',
  async execute(message, args, focus) {
    if (message.author.id !== settings.ownerID)
      return message.reply('Bu komutu sadece bot sahibi kullanabilir.');

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${message.guild.name} — Kullanıcı Paneli\n` +
        `Sunucuya ait tüm kişisel bilgilerine ve işlemlerine buradan ulaşabilirsin.\n\n` +
        `> Menüden istatistik, ceza ve rol bilgilerini görüntüleyebilirsin.\n` +
        `> Butonlarla istek, öneri veya şikayetini ekibe iletebilirsin.\n` +
        `> *Tüm bildirimler kayıt altına alınmaktadır.*`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('kp_istek')
          .setLabel('Istek Bildir')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('kp_oneri')
          .setLabel('Oneri Bildir')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('kp_sikayet')
          .setLabel('Sikayet Bildir')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('kp_yardim')
          .setLabel('Yardim Al')
          .setStyle(ButtonStyle.Primary),
      )
    );

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('kp_menu')
          .setPlaceholder('Yapmak istediginiz islemi secin...')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('Level & Istatistik')
              .setValue('kp_stat')
              .setDescription('Mesaj ve ses istatistiklerini gor.'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Ceza Kayitlarim')
              .setValue('kp_ceza')
              .setDescription('Aktif cezalarini ve ceza gecmisini incele.'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Sicilim')
              .setValue('kp_sicil')
              .setDescription('Tum ceza gecmisini listele.'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Siralamam')
              .setValue('kp_siralama')
              .setDescription('Sunucudaki mesaj ve ses siralamasini gor.'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Rol & Yetkilerim')
              .setValue('kp_roller')
              .setDescription('Sahip oldugun rolleri listele.'),
          )
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    await message.delete().catch(() => {});
  },
};
