const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  MessageFlags,
  ComponentType,
  PermissionFlagsBits,
} = require('discord.js');
const OzelKomut = require('../../global/models/OzelKomut');

module.exports = {
  name: 'ozel-komut',
  aliases: ['ozelkomut', 'komutkur'],
  category: 'BotOwner',
  async execute(message, args, focus) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
      return message.reply('Bu komutu kullanmak icin **Yonetici** yetkisi gerekli.');

    const sub = (args[0] || '').toLowerCase();

    
    if (sub === 'ekle') {
      const komutIsim = (args[1] || '').toLowerCase();
      if (!komutIsim)
        return message.reply('Kullanim: `.ozel-komut ekle [isim]`');

      const existing = await OzelKomut.findOne({ guildId: message.guild.id, komutIsim });
      if (existing)
        return message.reply(`**.${komutIsim}** isminde zaten bir ozel komut mevcut.`);

      const container1 = new ContainerBuilder();
      container1.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Komut Olusturma — .${komutIsim}**\n` +
          `> Adim 1/2: Komut kullanildiginda **verilecek rolleri** secin.`
        )
      );
      container1.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );
      container1.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId('ok_verilecek')
            .setPlaceholder('Verilecek rolleri secin...')
            .setMinValues(1)
            .setMaxValues(10)
        )
      );

      const msg = await message.reply({ components: [container1], flags: MessageFlags.IsComponentsV2 });

      let verilecekRoller = [];

      const collector = msg.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id,
        time: 60000,
        componentType: ComponentType.RoleSelect,
      });

      collector.on('collect', async i => {
        if (i.customId === 'ok_verilecek') {
          verilecekRoller = i.values;

          const container2 = new ContainerBuilder();
          container2.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Komut Olusturma — .${komutIsim}**\n` +
              `> Adim 2/2: Bu komutu **kullanabilecek rolleri** secin.`
            )
          );
          container2.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
          );
          container2.addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new RoleSelectMenuBuilder()
                .setCustomId('ok_yetkili')
                .setPlaceholder('Yetkili rolleri secin...')
                .setMinValues(1)
                .setMaxValues(10)
            )
          );

          return i.update({ components: [container2], flags: MessageFlags.IsComponentsV2 });
        }

        if (i.customId === 'ok_yetkili') {
          const yetkiliRoller = i.values;

          await OzelKomut.create({
            guildId:       message.guild.id,
            komutIsim,
            roller:        verilecekRoller,
            yetkiliRoller,
            ekleyenId:     message.author.id,
          });

          const container3 = new ContainerBuilder();
          container3.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Komut Olusturuldu**\n` +
              `> Komut        : \`.${komutIsim}\`\n` +
              `> Verilecek    : ${verilecekRoller.map(r => `<@&${r}>`).join(', ')}\n` +
              `> Kullanabilir : ${yetkiliRoller.map(r => `<@&${r}>`).join(', ')}`
            )
          );

          await i.update({ components: [container3], flags: MessageFlags.IsComponentsV2 });
          collector.stop('success');
        }
      });

      collector.on('end', (_, reason) => {
        if (reason !== 'success') {
          msg.edit({ components: [] }).catch(() => {});
        }
      });

      return;
    }

    
    if (sub === 'sil') {
      const komutIsim = (args[1] || '').toLowerCase();
      if (!komutIsim)
        return message.reply('Kullanim: `.ozel-komut sil [isim]`');

      const data = await OzelKomut.findOneAndDelete({ guildId: message.guild.id, komutIsim });
      if (!data)
        return message.reply(`**.${komutIsim}** isminde bir ozel komut bulunamadi.`);

      return message.reply(`**.${komutIsim}** ozel komutu silindi.`);
    }

    
    if (sub === 'liste') {
      const liste = await OzelKomut.find({ guildId: message.guild.id }).lean();
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Ozel Komutlar** (${liste.length} adet)\n` +
          (liste.length
            ? liste.map(k =>
                `> \`.${k.komutIsim}\` — Roller: ${k.roller.map(r => `<@&${r}>`).join(', ')}`
              ).join('\n')
            : '> Henuz ozel komut eklenmemis.')
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**Ozel Komut Sistemi**\n' +
        '> Sunucunuza dinamik rol verme komutlari tanimlayin.\n\n' +
        '> `.ozel-komut ekle [isim]` — Yeni komut olustur\n' +
        '> `.ozel-komut sil [isim]`  — Komut sil\n' +
        '> `.ozel-komut liste`       — Tum komutlari listele'
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
