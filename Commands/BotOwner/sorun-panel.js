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
  name: 'sorun-panel',
  description: 'Sorun cozme basvuru panelini gonderir.',
  usage: '.sorun-panel',
  aliases: ['sorunpanel'],
  category: 'BotOwner',

  async execute(message, _args, _focus) {
    if (!hasPerms(message)) return message.reply('Bu komutu kullanmak icin yetkin yok.');

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });

    const panel = new ContainerBuilder();
    panel.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '## Sorun Bildir\n' +
        'Sunucuda bir sorunla mı karşılaştın? Aşağıdaki butona basarak ekibimize iletebilirsin.\n' +
        'Bildirimin en kısa sürede incelenir ve sana geri dönüş yapılır.'
      )
    );
    panel.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    panel.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sorun_basvuru_ac')
          .setLabel('Sorun Bildir')
          .setStyle(ButtonStyle.Danger)
      )
    );

    await message.channel.send({ components: [panel], flags: MessageFlags.IsComponentsV2 });
    await message.delete().catch(() => {});
  },
};
