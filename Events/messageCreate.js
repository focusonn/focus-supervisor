const Afk = require('../global/models/Afk');
const { getUser: getStatUser } = require('../global/utils/statDB');
const TweetConfig = require('../global/models/TweetConfig');
const Tweet = require('../global/models/Tweet');
const { sendTweetMessage } = require('../global/utils/tweetHelper');
const { containsProfanity } = require('../global/utils/filterHelper');
const settings = require('../global/settings/settings.json');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, focus) {
    if (message.author.bot) return;
    if (settings.guildID && message.guild?.id !== settings.guildID) return;

    const existing = await Afk.findOne({ userId: message.author.id });
    if (existing) {
      await Afk.deleteOne({ userId: message.author.id });
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**AFK Modu Kapatildi**\n> Hosgeldin <@${message.author.id}>, AFK modun kaldirildi.`
        )
      );
      message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (message.mentions.users.size > 0) {
      for (const [, user] of message.mentions.users) {
        const afk = await Afk.findOne({ userId: user.id });
        if (!afk) continue;

        const elapsed = Math.floor((Date.now() - new Date(afk.since).getTime()) / 60000);
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent('**Kullanici AFK**')
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> Kullanici : <@${user.id}>\n` +
            `> Sebep     : ${afk.reason}\n` +
            `> Sure      : ${elapsed} dakika once`
          )
        );
        message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }

    if (!message.content.startsWith(focus.prefix)) {
      
      const tweetCfg = await TweetConfig.findOne({ guildId: message.guild.id });
      if (tweetCfg && message.channel.id === tweetCfg.channelId) {
        const content = message.content.trim();
        if (content.length > 0 && content.length <= 280) {
          await message.delete().catch(() => {});
          if (containsProfanity(content)) {
            const warn = await message.channel.send({ content: `<@${message.author.id}> Kufurlu icerik gonderemezsin.` });
            setTimeout(() => warn.delete().catch(() => {}), 5000);
            return;
          }
          const tweetId = `${message.guild.id}_${Date.now()}`;
          const tweet = await Tweet.create({
            tweetId,
            guildId: message.guild.id,
            authorId: message.author.id,
            authorUsername: message.author.username,
            authorAvatar: message.author.displayAvatarURL({ extension: 'png', size: 128 }),
            content,
          });
          await sendTweetMessage(message.channel, tweet);
          return;
        }
      }

      const stat = await getStatUser(message.guild.id, message.author.id);
      stat.mesaj += 1;
      await stat.save();
      return;
    }

    const args = message.content.slice(focus.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const resolvedName = focus.aliases.get(commandName) || commandName;
    const command = focus.commands.get(resolvedName);

    if (!command) {
      
      const OzelKomut = require('../global/models/OzelKomut');
      const ozelKomut = await OzelKomut.findOne({ guildId: message.guild.id, komutIsim: commandName }).lean().catch(() => null);
      if (ozelKomut) {
        const yetkili = ozelKomut.yetkiliRoller.some(r => message.member.roles.cache.has(r));
        if (!yetkili) return message.reply({ content: 'Bu komutu kullanma yetkiniz yok.', allowedMentions: { parse: [] } });

        const eklenecek = [], cikarilacak = [];
        for (const roleId of ozelKomut.roller) {
          if (message.member.roles.cache.has(roleId)) cikarilacak.push(roleId);
          else eklenecek.push(roleId);
        }
        if (eklenecek.length) await message.member.roles.add(eklenecek).catch(() => {});
        if (cikarilacak.length) await message.member.roles.remove(cikarilacak).catch(() => {});

        const { ContainerBuilder: CB, TextDisplayBuilder: TDB, MessageFlags: MF } = require('discord.js');
        const container = new CB();
        container.addTextDisplayComponents(
          new TDB().setContent(
            `**Roller Guncellendi**\n` +
            (eklenecek.length ? `> Eklendi   : ${eklenecek.map(r => `<@&${r}>`).join(', ')}\n` : '') +
            (cikarilacak.length ? `> Kaldirildi: ${cikarilacak.map(r => `<@&${r}>`).join(', ')}` : '')
          )
        );
        return message.reply({ components: [container], flags: MF.IsComponentsV2 });
      }
      return;
    }

    try {
      command.execute(message, args, focus);
    } catch (err) {
      console.error(err);
      message.reply('Komut calistirilirken bir hata olustu.');
    }
  },
};
