const { createCanvas, loadImage } = require('canvas');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');
const { drawBase, roundRect, hexToRgb } = require('../../global/utils/canvasHelper');
const { sendCanvasLog } = require('../../global/utils/logCanvas');

const TEMALAR = {
  klasik: { accent1: '#ff6b6b', accent2: '#ff9ecd', label: 'Klasik' },
  gece:   { accent1: '#8b5cf6', accent2: '#38bdf8', label: 'Gece' },
  doga:   { accent1: '#4ade80', accent2: '#86efac', label: 'Doga' },
  alev:   { accent1: '#f97316', accent2: '#fbbf24', label: 'Alev' },
  buz:    { accent1: '#38bdf8', accent2: '#a5f3fc', label: 'Buz' },
};

function shipScore(id1, id2) {
  const seed = (BigInt(id1) ^ BigInt(id2)).toString();
  let h = 0;
  for (const c of seed) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h) % 101;
}

function scoreLabel(score) {
  if (score >= 90) return 'Evlilik seviyesi';
  if (score >= 70) return 'Cok uyumlu';
  if (score >= 50) return 'Iyi gidiyorlar';
  if (score >= 30) return 'Biraz uyumlu';
  return 'Pek uyumlu degil';
}

async function drawShip(user1, user2, score, tema) {
  const { accent1, accent2 } = TEMALAR[tema];
  const { r: r1, g: g1, b: b1 } = hexToRgb(accent1);

  const W = 620, H = 220;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  drawBase(ctx, W, H, accent1, accent2);

  const avatarSize = 90;
  const avatarY = 50;
  const av1X = 50, av2X = W - 50 - avatarSize;

  async function drawAvatar(url, x, y) {
    try {
      const img = await loadImage(url);
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, avatarSize, avatarSize);
      ctx.restore();
      ctx.strokeStyle = `rgba(${r1},${g1},${b1},0.6)`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.stroke();
    } catch {
      roundRect(ctx, x, y, avatarSize, avatarSize, avatarSize / 2);
      ctx.fillStyle = `rgba(${r1},${g1},${b1},0.2)`;
      ctx.fill();
    }
  }

  await drawAvatar(user1.displayAvatarURL({ extension: 'png', size: 128 }), av1X, avatarY);
  await drawAvatar(user2.displayAvatarURL({ extension: 'png', size: 128 }), av2X, avatarY);

  const CX = W / 2, CY = avatarY + avatarSize / 2;
  const heartGlow = ctx.createRadialGradient(CX, CY, 0, CX, CY, 36);
  heartGlow.addColorStop(0, `rgba(${r1},${g1},${b1},0.35)`);
  heartGlow.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
  ctx.fillStyle = heartGlow;
  ctx.beginPath();
  ctx.arc(CX, CY, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 28px Sans';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent1;
  ctx.fillText('\u2665', CX, CY);

  ctx.font = '700 13px Sans';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(user1.username, av1X + avatarSize / 2, avatarY + avatarSize + 18);
  ctx.fillText(user2.username, av2X + avatarSize / 2, avatarY + avatarSize + 18);

  const barX = 40, barY = H - 46, barW = W - 80, barH = 10;
  roundRect(ctx, barX, barY, barW, barH, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fill();

  const fill = Math.max(4, Math.round((score / 100) * barW));
  const barGrad = ctx.createLinearGradient(barX, 0, barX + fill, 0);
  barGrad.addColorStop(0, accent1);
  barGrad.addColorStop(1, accent2);
  roundRect(ctx, barX, barY, fill, barH, 5);
  ctx.fillStyle = barGrad;
  ctx.fill();

  ctx.font = '700 22px Sans';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const scoreGrad = ctx.createLinearGradient(CX - 40, 0, CX + 40, 0);
  scoreGrad.addColorStop(0, accent1);
  scoreGrad.addColorStop(1, accent2);
  ctx.fillStyle = scoreGrad;
  ctx.fillText(`${score}%`, CX, barY - 18);

  ctx.font = '400 11px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText(scoreLabel(score), CX, barY - 4);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  return canvas;
}

function buildContainer(imgUrl, user1, user2, score, tema) {
  const { label } = TEMALAR[tema];

  const container = new ContainerBuilder();
  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imgUrl))
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `**Ship Sonucu**\n` +
      `> ${user1.username} ile ${user2.username}\n` +
      `> Uyum : \`${score}%\`  —  ${scoreLabel(score)}\n` +
      `> Tema : \`${label}\``
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const select = new StringSelectMenuBuilder()
    .setCustomId(`ship_tema_${user1.id}_${user2.id}`)
    .setPlaceholder('Tema sec...')
    .addOptions(
      Object.entries(TEMALAR).map(([key, val]) => ({
        label: val.label,
        value: key,
        default: key === tema,
      }))
    );
  container.addActionRowComponents(new ActionRowBuilder().addComponents(select));

  const tanis = new ButtonBuilder()
    .setCustomId(`ship_tanis_${user1.id}_${user2.id}`)
    .setLabel('Tanis')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(score < 80);

  const tekrar = new ButtonBuilder()
    .setCustomId(`ship_tekrar_${user1.id}_${user2.id}`)
    .setLabel('Tekrar')
    .setStyle(ButtonStyle.Secondary);

  const sil = new ButtonBuilder()
    .setCustomId(`ship_sil`)
    .setLabel('Sil')
    .setStyle(ButtonStyle.Danger);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(tanis, tekrar, sil));

  return container;
}

async function renderAndSend(target, user1, user2, score, tema, isUpdate = false) {
  const canvas = await drawShip(user1, user2, score, tema);
  const guild = target.guild ?? target.message?.guild;
  const url = await sendCanvasLog(guild, canvas);

  let container;
  if (url) {
    container = buildContainer(url, user1, user2, score, tema);
  } else {
    
    const { label } = TEMALAR[tema];
    container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Ship Sonucu**\n` +
        `> ${user1.username} ile ${user2.username}\n` +
        `> Uyum : \`${score}%\`  —  ${scoreLabel(score)}\n` +
        `> Tema : \`${label}\``
      )
    );
    const select = new StringSelectMenuBuilder()
      .setCustomId(`ship_tema_${user1.id}_${user2.id}`)
      .setPlaceholder('Tema sec...')
      .addOptions(Object.entries(TEMALAR).map(([key, val]) => ({ label: val.label, value: key, default: key === tema })));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(select));
    const tanis = new ButtonBuilder().setCustomId(`ship_tanis_${user1.id}_${user2.id}`).setLabel('Tanis').setStyle(ButtonStyle.Primary).setDisabled(score < 80);
    const tekrar = new ButtonBuilder().setCustomId(`ship_tekrar_${user1.id}_${user2.id}`).setLabel('Tekrar').setStyle(ButtonStyle.Secondary);
    const sil = new ButtonBuilder().setCustomId(`ship_sil`).setLabel('Sil').setStyle(ButtonStyle.Danger);
    container.addActionRowComponents(new ActionRowBuilder().addComponents(tanis, tekrar, sil));
  }

  const payload = { components: [container], flags: MessageFlags.IsComponentsV2 };
  if (isUpdate) return target.update(payload);
  return target.reply(payload);
}

module.exports = {
  name: 'ship',
  description: 'Iki kullanicinin uyumunu olcer.',
  usage: '.ship [@kullanici / ID]',
  aliases: [],
  category: 'Genel',

  async execute(message, args, focus) {
    let user1 = message.author;
    let user2 = null;

    
    if (args[0]) {
      const raw = args[0].replace(/[<@!>]/g, '');
      try {
        user2 = await focus.users.fetch(raw);
      } catch {
        return message.reply('Kullanici bulunamadi. Etiktle veya gecerli bir ID gir.');
      }
    }

    
    if (!user2) {
      let pool = message.guild.members.cache.filter(m => !m.user.bot && m.user.id !== user1.id);
      if (pool.size < 2) {
        const fetched = await message.guild.members.fetch({ limit: 100 });
        pool = fetched.filter(m => !m.user.bot && m.user.id !== user1.id);
      }
      if (pool.size === 0) return message.reply('Sunucuda baska kullanici yok.');
      const arr = [...pool.values()];
      user2 = arr[Math.floor(Math.random() * arr.length)].user;
    }

    if (user2.id === user1.id) return message.reply('Kendinle ship yapamazsin.');

    const score = shipScore(user1.id, user2.id);
    let currentTema = 'klasik';

    const sent = await renderAndSend(message, user1, user2, score, currentTema);

    const collector = sent.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 120000,
    });

    let currentScore = score;

    collector.on('collect', async interaction => {
      const id = interaction.customId;

      if (id.startsWith('ship_tema_')) {
        currentTema = interaction.values[0];
        const [, , id1, id2] = id.split('_');
        const u1 = await focus.users.fetch(id1);
        const u2 = await focus.users.fetch(id2);
        await renderAndSend(interaction, u1, u2, currentScore, currentTema, true);
        return;
      }

      if (id.startsWith('ship_tekrar_')) {
        const [, , id1, id2] = id.split('_');
        const u1 = await focus.users.fetch(id1);
        const u2 = await focus.users.fetch(id2);
        currentScore = Math.floor(Math.random() * 101);
        await renderAndSend(interaction, u1, u2, currentScore, currentTema, true);
        return;
      }

      if (id.startsWith('ship_tanis_')) {
        const gonderen = interaction.user;
        const [, , id1, id2] = id.split('_');
        
        const hedefId = gonderen.id === id1 ? id2 : id1;
        const hedef = await focus.users.fetch(hedefId);

        const dmContainer = new ContainerBuilder();
        dmContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Tanis Istegi**\n` +
            `> **${gonderen.username}** sana tanis istegi gonderiyor.\n` +
            `> Ship uyumu: \`${currentScore}%\`  —  ${scoreLabel(currentScore)}`
          )
        );
        dmContainer.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

        const kabul = new ButtonBuilder()
          .setCustomId(`tanis_kabul_${gonderen.id}`)
          .setLabel('Kabul Et')
          .setStyle(ButtonStyle.Success);

        const reddet = new ButtonBuilder()
          .setCustomId(`tanis_reddet_${gonderen.id}`)
          .setLabel('Reddet')
          .setStyle(ButtonStyle.Danger);

        dmContainer.addActionRowComponents(new ActionRowBuilder().addComponents(kabul, reddet));

        let dmSent;
        try {
          const dmChannel = await hedef.createDM();
          dmSent = await dmChannel.send({
            components: [dmContainer],
            flags: MessageFlags.IsComponentsV2,
          });
        } catch {
          await interaction.reply({
            content: `${hedef.username} adli kullanicinin DM'leri kapali.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        await interaction.reply({
          content: `Tanis istegi **${hedef.username}** adli kullaniciya DM olarak gonderildi.`,
          flags: MessageFlags.Ephemeral,
        });

        const dmCollector = dmSent.createMessageComponentCollector({
          filter: i => i.user.id === hedef.id,
          time: 300000,
          max: 1,
        });

        dmCollector.on('collect', async dmInteraction => {
          const accepted = dmInteraction.customId.startsWith('tanis_kabul_');

          const resultContainer = new ContainerBuilder();
          resultContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              accepted
                ? `**Istek Kabul Edildi**\n> **${hedef.username}** tanis isteginizi kabul etti.`
                : `**Istek Reddedildi**\n> **${hedef.username}** tanis isteginizi reddetti.`
            )
          );

          await dmInteraction.update({
            components: [resultContainer],
            flags: MessageFlags.IsComponentsV2,
          });

          try {
            const gonderenDM = await gonderen.createDM();
            const notifContainer = new ContainerBuilder();
            notifContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                accepted
                  ? `**Tanis Istegi Kabul Edildi**\n> **${hedef.username}** tanis isteginizi kabul etti.`
                  : `**Tanis Istegi Reddedildi**\n> **${hedef.username}** tanis isteginizi reddetti.`
              )
            );
            await gonderenDM.send({
              components: [notifContainer],
              flags: MessageFlags.IsComponentsV2,
            });
          } catch {}
        });

        return;
      }

      if (id === 'ship_sil') {
        await interaction.message.delete().catch(() => {});
        await interaction.deferUpdate().catch(() => {});
      }
    });
  },
};
