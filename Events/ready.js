module.exports = {
  name: 'clientReady',
  once: true,
  async execute(focus) {
    const settings = require('../global/settings/settings.json');
    console.log(`${focus.user.tag} oynuyor...`);
    focus.user.setActivity(settings.activity, { type: settings.activityType });

    if (settings.voiceID) {
      try {
        const { joinVoiceChannel } = require('@discordjs/voice');
        const channel = await focus.channels.fetch(settings.voiceID).catch(() => null);
        if (channel && channel.isVoiceBased()) {
          joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true,
          });
          console.log(`Ses kanalina girildi: ${channel.name}`);
        }
      } catch (err) {
        console.error('Ses kanali hatasi:', err.message);
      }
    }
  },
};
