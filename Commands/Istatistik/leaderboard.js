const { getTop } = require('../../global/utils/statDB');
const {
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SeparatorSpacingSize, MessageFlags,
} = require('discord.js');

const FIELDS = [
  { key: 'mesaj',            label: 'Mesaj',            birim: '' },
  { key: 'ses',              label: 'Ses',              birim: ' dk' },
  { key: 'kamera',           label: 'Kamera',           birim: ' dk' },
  { key: 'yayin',            label: 'Yayin',            birim: ' dk' },
  { key: 'inviteKullanilan', label: 'Invite',           birim: '' },
];

async function buildContent(guild) {
  await guild.members.fetch().catch(() => {});

  const sections = [];

  for (const field of FIELDS) {
    const entries = await getTop(guild.id, field.key, 10);
    const lines = [`**${field.label}**`];

    if (!entries.length) {
      lines.push('> Henuz veri yok.');
    } else {
      const ranks = ['1.', '2.', '3.'];
      entries.forEach((e, i) => {
        const m = guild.members.cache.get(e.userId);
        const name = m?.user.username || e.userId;
        const rank = ranks[i] || `${i + 1}.`;
        lines.push(`> ${rank} ${name} — \`${e[field.key].toLocaleString()}${field.birim}\``);
      });
    }

    sections.push(lines.join('\n'));
  }

  return sections;
}

module.exports = {
  name: 'leaderboard',
  aliases: ['lb'],
  category: 'Istatistik',

  async execute(message, args, focus) {
    const sections = await buildContent(message.guild);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## Sunucu Siralamalari')
    );

    for (let i = 0; i < sections.length; i++) {
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(sections[i])
      );
    }

    const sent = await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    
    let count = 0;
    const interval = setInterval(async () => {
      count++;
      if (count >= 5) clearInterval(interval);

      try {
        const updated = await buildContent(message.guild);
        const newContainer = new ContainerBuilder();
        newContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## Sunucu Siralamalari')
        );
        for (let i = 0; i < updated.length; i++) {
          newContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
          );
          newContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(updated[i])
          );
        }
        await sent.edit({ components: [newContainer], flags: MessageFlags.IsComponentsV2 });
      } catch {
        clearInterval(interval);
      }
    }, 60_000);
  },
};
