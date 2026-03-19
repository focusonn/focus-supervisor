const StaffConfig = require('../../global/models/StaffConfig');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  MessageFlags,
} = require('discord.js');
const settings = require('../../global/settings/settings.json');

const ALAN_LABELS = {
  chat:         'Chat',
  ban_jail:     'Ban / Jail',
  mute:         'Mute',
  yetkili_alim: 'Yetkili Alim',
  rol_denetim:  'Rol Denetim',
  register:     'Register',
  streamer:     'Streamer',
  konser:       'Konser',
  sorun_cozme:  'Sorun Cozme',
  etkinlik:     'Etkinlik',
  public:       'Public',
};

function hasPerms(message) {
  return (
    message.author.id === settings.ownerID ||
    message.member.permissions.has('ManageGuild')
  );
}

module.exports = {
  name: 'sorumluluk-basvuru',
  description: 'Sorumluluk basvuru panelini gonderir.',
  usage: '.sorumluluk-basvuru [kanal-ayarla]',
  aliases: ['basvuru-panel', 'staff-basvuru'],
  category: 'BotOwner',

  async execute(message, args, _focus) {
    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });

    if (args[0] === 'kanal-ayarla') {
      if (!hasPerms(message)) return message.reply('Bu islemi yapmak icin yetkin yok.');

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '**Basvuru Kanali Ayarla**\n' +
          `> Sunucumuzda Yetkililerimiz Özel Sorumluluk Seçme Paneli.'}`
        )
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );
      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('basvuru_kanal_sec')
            .setPlaceholder('Basvuru kanalini sec...')
            .setChannelTypes(ChannelType.GuildText)
        )
      );

      const sent = await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      const col = sent.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id,
        time: 60000,
        max: 1,
      });
      col.on('collect', async i => {
        await StaffConfig.findOneAndUpdate(
          { guildId: message.guild.id },
          { basvuruKanali: i.
values[0] },
          { upsert: true }
        );
        const updated = new ContainerBuilder();
        updated.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`Basvuru kanali <#${i.values[0]}> olarak ayarlandi.`)
        );
        await i.update({ components: [updated], flags: MessageFlags.IsComponentsV2 });
      });
      return;
    }

    const panel = new ContainerBuilder();
    panel.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '## Sorumluluk Başvuru\n' +
        'Sunucumuzda sorumluluk almak istiyorsan aşağıdan ilgili alanı seçerek başvurunu iletebilirsin.\n' +
        'Başvurular yetkili ekibimiz tarafından incelenir, sonuç sana bildirilir.'
      )
    );
    panel.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    panel.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('basvuru_alan_sec')
          .setPlaceholder('Basvurmak istedigin alani sec...')
          .addOptions(
            Object.entries(ALAN_LABELS).map(([value, label]) => ({ label, value }))
          )
      )
    );

    await message.channel.send({ components: [panel], flags: MessageFlags.IsComponentsV2 });
    await message.delete().catch(() => {});
  },
};
