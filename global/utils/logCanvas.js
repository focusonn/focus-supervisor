const { AttachmentBuilder } = require('discord.js');
const StaffConfig = require('../models/StaffConfig');

async function sendCanvasLog(guild, canvas) {
  try {
    const cfg = await StaffConfig.findOne({ guildId: guild.id });
    const channelId = cfg?.canvasLogKanali;
    if (!channelId) {
      console.log('[canvasLog] canvasLogKanali ayarli degil, guildId:', guild.id);
      return null;
    }

    
    let channel = guild.client.channels.cache.get(channelId);
    if (!channel) {
      channel = await guild.client.channels.fetch(channelId).catch(() => null);
    }
    if (!channel) {
      console.log('[canvasLog] Kanal bulunamadi, channelId:', channelId);
      return null;
    }

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'canvas.png' });
    const msg = await channel.send({ files: [attachment] });
    return msg.attachments.first()?.url ?? null;
  } catch (err) {
    console.error('[canvasLog] Hata:', err.message);
    return null;
  }
}

module.exports = { sendCanvasLog };
