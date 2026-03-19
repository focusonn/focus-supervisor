const Afk = require('../../global/models/Afk');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

module.exports = {
  name: 'afk',
  description: 'AFK modunu acar veya kapatir.',
  usage: '.afk [sebep]',
  aliases: [],
  category: 'Genel',

  async execute(message, args, focus) {
    const userId = message.author.id;
    const existing = await Afk.findOne({ userId });

    if (existing) {
      await Afk.deleteOne({ userId });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**AFK Modu Kapatildi**\n> Hosgeldin <@${userId}>, AFK modun kaldirildi.`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const reason = args.join(' ') || 'Sebep belirtilmedi.';
    await Afk.create({ userId, reason, since: new Date() });

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**AFK Modu Acildi**')
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> Kullanici : <@${userId}>\n` +
        `> Sebep     : ${reason}`
      )
    );

    message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
