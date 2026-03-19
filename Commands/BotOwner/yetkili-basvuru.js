const StaffConfig = require('../../global/models/StaffConfig');
const {
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, MessageFlags,
} = require('discord.js');
const settings = require('../../global/settings/settings.json');

function hasPerms(message) {
  return message.author.id === settings.ownerID || message.member.permissions.has('ManageGuild');
}

module.exports = {
  name: 'yetkili-basvuru',
  description: 'Yetkili basvuru panelini gonderir.',
  usage: '.yetkili-basvuru',
  aliases: ['ybasvuru'],
  category: 'BotOwner',

  async execute(message, _args, _focus) {
    if (!hasPerms(message)) return message.reply('Bu komutu kullanmak icin yetkin yok.');

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });

    const panel = new ContainerBuilder();
    panel.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '## Yetkili Başvuru\n' +
        'Sunucumuzda yetkili olmak istiyorsan aşağıdaki butona basarak başvurunu iletebilirsin.\n' +
        'Başvurular yetkili ekibimiz tarafından değerlendirilir, sonuç sana bildirilir.'
      )
    );
    panel.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    panel.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('yetkili_basvuru_ac')
          .setLabel('Basvur')
          .setStyle(ButtonStyle.Primary)
      )
    );

    await message.channel.send({ components: [panel], flags: MessageFlags.IsComponentsV2 });
    await message.delete().catch(() => {});
  },
};
