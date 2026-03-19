const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require('discord.js');
const StaffConfig = require('../../global/models/StaffConfig');
const { hasRole } = require('../../global/utils/staffHelper');
const { puanEkle } = require('../../global/utils/cezaPuanHelper');
const settings = require('../../global/settings/settings.json');

const SURELER = [
  { label: '1 Dakika',   value: '60000',      description: 'Chat mute — 1 dakika' },
  { label: '5 Dakika',   value: '300000',     description: 'Chat mute — 5 dakika' },
  { label: '10 Dakika',  value: '600000',     description: 'Chat mute — 10 dakika' },
  { label: '30 Dakika',  value: '1800000',    description: 'Chat mute — 30 dakika' },
  { label: '1 Saat',     value: '3600000',    description: 'Chat mute — 1 saat' },
  { label: '3 Saat',     value: '10800000',   description: 'Chat mute — 3 saat' },
  { label: '6 Saat',     value: '21600000',   description: 'Chat mute — 6 saat' },
  { label: '12 Saat',    value: '43200000',   description: 'Chat mute — 12 saat' },
  { label: '1 Gun',      value: '86400000',   description: 'Chat mute — 1 gun' },
  { label: '3 Gun',      value: '259200000',  description: 'Chat mute — 3 gun' },
  { label: '7 Gun',      value: '604800000',  description: 'Chat mute — 7 gun' },
  { label: '28 Gun',     value: '2419200000', description: 'Chat mute — 28 gun (maksimum)' },
];

module.exports = {
  name: 'mute',
  aliases: [],
  category: 'Ceza',
  async execute(message, args, focus) {
    const yetkili = await hasRole(message.member, message.guild.id, 'mute', 'sorumluluk') ||
                    message.member.permissions.has('ManageGuild') ||
                    message.author.id === settings.ownerID;
    if (!yetkili) return message.reply('Bu komutu kullanmak icin mute sorumluluk rolune sahip olmalisin.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('Gecerli bir kullanici belirt.');

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Mute — ${target.user.tag}**\n` +
        `> Sebep: ${reason}\n` +
        `> Mute suresini asagidan sec.`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`mute_sure_${target.id}_${encodeURIComponent(reason)}_${message.author.id}`)
          .setPlaceholder('Sure sec...')
          .addOptions(SURELER)
      )
    );

    await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
