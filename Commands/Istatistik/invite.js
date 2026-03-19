const Invite = require('../../global/models/Invite');
const { getUser } = require('../../global/utils/statDB');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

module.exports = {
  name: 'invite',
  description: 'Davet istatistiklerini gosterir.',
  usage: '.invite [@kullanici]',
  aliases: ['davet'],
  category: 'Istatistik',

  async execute(message, args, focus) {
    const target = message.mentions.users.first() || message.author;
    const stat = await getUser(message.guild.id, target.id);
    const invites = await Invite.find({ guildId: message.guild.id, userId: target.id });
    const totalUses = invites.reduce((a, i) => a + i.uses, 0);

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**${target.username} Davet Bilgisi**`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> Toplam Davet Linki : \`${invites.length}\`\n` +
        `> Toplam Kullanim    : \`${totalUses}\`\n` +
        `> Sunucuya Katilan   : \`${stat.inviteKullanilan}\``
      )
    );

    if (invites.length > 0) {
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '**Davet Linkleri**\n' +
          invites.slice(0, 8).map(i => `> \`${i.code}\` — \`${i.uses}\` kullanim`).join('\n')
        )
      );
    }

    message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
