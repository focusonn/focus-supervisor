const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} = require('discord.js');
const { createCanvas } = require('canvas');
const { sendCanvasLog } = require('../../global/utils/logCanvas');

module.exports = {
  name: 'help',
  description: 'Tum komutlari listeler veya bir komut hakkinda bilgi verir.',
  usage: '.help [komut]',
  aliases: ['h'],
  category: 'Genel',

  async execute(message, args, focus) {
    const grouped = {};
    focus.commands.forEach(cmd => {
      const cat = cmd.category || 'Genel';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(cmd);
    });

    if (args[0]) {
      const resolvedName = focus.aliases.get(args[0]) || args[0];
      const command = focus.commands.get(resolvedName);
      if (!command) return message.reply('Boyle bir komut bulunamadi.');
      return sendCommandDetail(message, command, focus);
    }

    sendCategoryList(message, grouped, focus);
  },
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function measureChip(ctx, text) {
  ctx.font = '600 11px Sans';
  return ctx.measureText(text).width + 18;
}

async function buildMainCanvas(grouped, focus) {
  const categories = Object.keys(grouped);
  const totalCommands = Object.values(grouped).reduce((a, c) => a + c.length, 0);

  const W = 860;
  const H = 110;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  
  ctx.fillStyle = '#0b0b14';
  ctx.fillRect(0, 0, W, H);

  
  const g1 = ctx.createRadialGradient(0, H / 2, 0, 0, H / 2, 260);
  g1.addColorStop(0, 'rgba(255,80,80,0.18)');
  g1.addColorStop(1, 'rgba(255,80,80,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  
  const g2 = ctx.createRadialGradient(W, H / 2, 0, W, H / 2, 260);
  g2.addColorStop(0, 'rgba(139,92,246,0.14)');
  g2.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  
  const topLine = ctx.createLinearGradient(0, 0, W, 0);
  topLine.addColorStop(0, 'rgba(255,80,80,0)');
  topLine.addColorStop(0.3, 'rgba(255,80,80,0.7)');
  topLine.addColorStop(0.7, 'rgba(139,92,246,0.7)');
  topLine.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.strokeStyle = topLine;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(W, 1);
  ctx.stroke();

  
  const botLine = ctx.createLinearGradient(0, 0, W, 0);
  botLine.addColorStop(0, 'rgba(255,255,255,0)');
  botLine.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  botLine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = botLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H - 1);
  ctx.lineTo(W, H - 1);
  ctx.stroke();

  
  const botName = focus.user.username;
  ctx.font = '300 36px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(botName, W / 2, H / 2 - 6);

  
  ctx.font = '400 12px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText(`${totalCommands} komut  ·  ${categories.length} kategori`, W / 2, H / 2 + 22);

  
  const nameW = ctx.measureText(botName).width;
  const lineStart = W / 2 - nameW / 2 - 20;
  const lineEnd = W / 2 + nameW / 2 + 20;

  const lGrad = ctx.createLinearGradient(0, 0, lineStart, 0);
  lGrad.addColorStop(0, 'rgba(255,80,80,0)');
  lGrad.addColorStop(1, 'rgba(255,80,80,0.4)');
  ctx.strokeStyle = lGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, H / 2 - 6);
  ctx.lineTo(lineStart, H / 2 - 6);
  ctx.stroke();

  const rGrad = ctx.createLinearGradient(lineEnd, 0, W, 0);
  rGrad.addColorStop(0, 'rgba(139,92,246,0.4)');
  rGrad.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.strokeStyle = rGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lineEnd, H / 2 - 6);
  ctx.lineTo(W - 40, H / 2 - 6);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  return canvas;
}

async function buildBanner(title, subtitle, accentColor, type) {
  const W = 900, H = 180;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const { r, g, b } = hexToRgb(accentColor);

  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#0d0d1a');
  bgGrad.addColorStop(1, '#1a1a2e');
  drawRoundRect(ctx, 0, 0, W, H, 20);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  const glow = ctx.createRadialGradient(W - 80, 40, 0, W - 80, 40, 200);
  glow.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
  glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(60, H - 30, 0, 60, H - 30, 140);
  glow2.addColorStop(0, `rgba(${r},${g},${b},0.18)`);
  glow2.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, `rgba(${r},${g},${b},0.9)`);
  borderGrad.addColorStop(0.5, `rgba(${r},${g},${b},0.4)`);
  borderGrad.addColorStop(1, `rgba(${r},${g},${b},0.9)`);
  drawRoundRect(ctx, 1.5, 1.5, W - 3, H - 3, 19);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
  for (let dx = 0; dx < 6; dx++)
    for (let dy = 0; dy < 4; dy++) {
      ctx.beginPath();
      ctx.arc(W - 30 - dx * 18, 20 + dy * 18, 2, 0, Math.PI * 2);
      ctx.fill();
    }

  const barGrad = ctx.createLinearGradient(0, 25, 0, H - 25);
  barGrad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  barGrad.addColorStop(0.3, accentColor);
  barGrad.addColorStop(0.7, accentColor);
  barGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(22, 25, 4, H - 50, 2);
  ctx.fill();

  const iconX = 55, iconY = H / 2;
  ctx.beginPath();
  ctx.arc(iconX, iconY, 28, 0, Math.PI * 2);
  const iconBg = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, 28);
  iconBg.addColorStop(0, `rgba(${r},${g},${b},0.3)`);
  iconBg.addColorStop(1, `rgba(${r},${g},${b},0.08)`);
  ctx.fillStyle = iconBg;
  ctx.fill();
  ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 22px Sans';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const icons = { main: '?', category: '#', detail: '/' };
  ctx.fillText(icons[type] || '?', iconX, iconY);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.shadowColor = `rgba(${r},${g},${b},0.6)`;
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px Sans';
  ctx.fillText(title, 100, H / 2 - 8);
  ctx.shadowBlur = 0;

  ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
  ctx.font = '17px Sans';
  ctx.fillText(subtitle, 102, H / 2 + 26);

  const lineGrad = ctx.createLinearGradient(22, 0, W - 22, 0);
  lineGrad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  lineGrad.addColorStop(0.3, `rgba(${r},${g},${b},0.5)`);
  lineGrad.addColorStop(0.7, `rgba(${r},${g},${b},0.5)`);
  lineGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(22, H - 22);
  ctx.lineTo(W - 22, H - 22);
  ctx.stroke();

  return canvas;
}

async function buildMainContainer(grouped, focus, guild) {
  const categories = Object.keys(grouped);
  const totalCommands = Object.values(grouped).reduce((a, c) => a + c.length, 0);

  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '# Yardim Menusu\n' +
      `Merhaba <@${focus.user.id}> tarafindan sunulan komut rehberine hosgeldiniz.\n` +
      'Asagidan bir kategori secin ve komutlari inceleyin.'
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Sistem Bilgisi**\n' +
      `> Toplam Komut  : \`${totalCommands}\`\n` +
      `> Toplam Kategori : \`${categories.length}\``
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Nasil Kullanilir?**\n' +
      '> Asagidaki menuyu acarak bir kategori secin.\n' +
      '> Sectiginiz kategorideki tum komutlar listelenecektir.\n' +
      `> Belirli bir komut icin \`${focus.prefix}help <komut>\` yazabilirsiniz.`
    )
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category')
    .setPlaceholder('Bir kategori seciniz...')
    .addOptions(
      categories.map(cat => ({
        label: cat,
        value: cat,
        description: `${grouped[cat].length} komut bulunuyor`,
      }))
    );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(selectMenu)
  );

  return { container, attachment: null };
}

const PAGE_SIZE = 5;

async function buildCategoryContainer(cat, cmds, focus, guild, page = 0) {
  const totalPages = Math.ceil(cmds.length / PAGE_SIZE);
  const pageCmds = cmds.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${cat}\n` +
      `Bu kategoride toplam \`${cmds.length}\` komut bulunmaktadir.`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Komut Listesi**\n' +
      pageCmds.map(c =>
        `> \`${focus.prefix}${c.name}\`\n` +
        `> ${c.description || 'Aciklama bulunmuyor.'}`
      ).join('\n\n')
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> Detayli bilgi icin \`${focus.prefix}help <komut>\` yazabilirsiniz.`
    )
  );

  const backButton = new ButtonBuilder()
    .setCustomId('help_back')
    .setLabel('Ana Menu')
    .setStyle(ButtonStyle.Secondary);

  const prevButton = new ButtonBuilder()
    .setCustomId(`help_page_prev_${cat}`)
    .setLabel('Onceki')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(page === 0);

  const nextButton = new ButtonBuilder()
    .setCustomId(`help_page_next_${cat}`)
    .setLabel('Sonraki')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(page >= totalPages - 1);

  if (totalPages > 1) {
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(backButton, prevButton, nextButton)
    );
  } else {
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(backButton)
    );
  }

  return { container, attachment: null };
}

async function buildDetailContainer(command, focus, guild) {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${command.name}\n` +
      `${command.description || 'Bu komut icin aciklama bulunmuyor.'}`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Komut Bilgisi**\n' +
      `> Kullanim    : \`${command.usage || focus.prefix + command.name}\`\n` +
      `> Aliaslar   : \`${command.aliases?.join('`, `') || 'Yok'}\`\n` +
      `> Kategori   : \`${command.category || 'Genel'}\``
    )
  );

  return { container, attachment: null };
}

function replyWithContainer(target, container, attachment, flags) {
  const files = attachment ? [attachment] : [];
  return target.reply({ components: [container], flags, files });
}

async function sendCategoryList(message, grouped, focus) {
  const { container, attachment } = await buildMainContainer(grouped, focus, message.guild);

  const sent = await replyWithContainer(message, container, attachment, MessageFlags.IsComponentsV2);

  let currentCat = null;
  let currentPage = 0;

  const collector = sent.createMessageComponentCollector({
    filter: i => i.user.id === message.author.id,
    time: 120000,
  });

  collector.on('collect', async interaction => {
    const id = interaction.customId;

    if (id === 'help_category') {
      currentCat = interaction.values[0];
      currentPage = 0;
      const { container: c, attachment: a } = await buildCategoryContainer(currentCat, grouped[currentCat], focus, message.guild, currentPage);
      await interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2, files: a ? [a] : [] });
      return;
    }

    if (id === 'help_back') {
      currentCat = null;
      currentPage = 0;
      const { container: c, attachment: a } = await buildMainContainer(grouped, focus, message.guild);
      await interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2, files: a ? [a] : [] });
      return;
    }

    if (id.startsWith('help_page_prev_')) {
      currentCat = id.replace('help_page_prev_', '');
      currentPage = Math.max(0, currentPage - 1);
      const { container: c, attachment: a } = await buildCategoryContainer(currentCat, grouped[currentCat], focus, message.guild, currentPage);
      await interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2, files: a ? [a] : [] });
      return;
    }

    if (id.startsWith('help_page_next_')) {
      currentCat = id.replace('help_page_next_', '');
      const totalPages = Math.ceil(grouped[currentCat].length / PAGE_SIZE);
      currentPage = Math.min(totalPages - 1, currentPage + 1);
      const { container: c, attachment: a } = await buildCategoryContainer(currentCat, grouped[currentCat], focus, message.guild, currentPage);
      await interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2, files: a ? [a] : [] });
      return;
    }
  });
}

async function sendCommandDetail(message, command, focus) {
  const { container, attachment } = await buildDetailContainer(command, focus, message.guild);
  replyWithContainer(message, container, attachment, MessageFlags.IsComponentsV2);
}
