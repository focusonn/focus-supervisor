const ConfessionConfig = require('../../global/models/ConfessionConfig');
const settings = require('../../global/settings/settings.json');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');

module.exports = {
  name: 'itiraf-panel',
  description: 'Itiraf panelini gonderir.',
  usage: '.itiraf-panel [#kanal]',
  aliases: ['confess-panel'],
  category: 'BotOwner',

  async execute(message, args, focus) {
    if (
      message.author.id !== settings.ownerID &&
      !message.member.permissions.has('ManageGuild')
    ) return message.reply('Yetkiniz yok.');

    const cfg = await ConfessionConfig.findOne({ guildId: message.guild.id });
    if (!cfg?.channelId) return message.reply('Once `.setup` ile itiraf kanalini ayarlayin.');

    const target = message.mentions.channels.first() || message.channel;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '## Anonim İtiraf\n' +
        'Kimliğin gizli kalarak itirafını sunucuyla paylaşabilirsin.\n' +
        'Aşağıdaki butona bas, itirafını yaz — sadece itirafın yayınlanır, ismin görünmez.'
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const btn = new ButtonBuilder()
      .setCustomId('confession_open')
      .setLabel('Itiraf Et')
      .setStyle(ButtonStyle.Primary);

    container.addActionRowComponents(new ActionRowBuilder().addComponents(btn));

    await target.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    await message.reply({ content: `Panel <#${target.id}> kanalina gonderildi.`, flags: MessageFlags.Ephemeral });
  },
};
