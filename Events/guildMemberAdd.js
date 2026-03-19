const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const Invite = require('../global/models/Invite');
const StaffConfig = require('../global/models/StaffConfig');
const { getUser } = require('../global/utils/statDB');
const settings = require('../global/settings/settings.json');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, focus) {
    if (settings.guildID && member.guild?.id !== settings.guildID) return;
    const guild = member.guild;

    
    try {
      const invites   = await guild.invites.fetch();
      const dbInvites = await Invite.find({ guildId: guild.id });

      for (const dbInv of dbInvites) {
        const current = invites.get(dbInv.code);
        if (!current) continue;
        if (current.uses > dbInv.uses) {
          dbInv.uses = current.uses;
          await dbInv.save();
          const stat = await getUser(guild.id, dbInv.userId);
          stat.inviteKullanilan += 1;
          await stat.save();
          break;
        }
      }
    } catch {}

    
    try {
      console.log(`[guildMemberAdd] ${member.user.tag} katildi — guild: ${guild.id}`);
      const cfg = await StaffConfig.findOne({ guildId: guild.id });
      console.log(`[guildMemberAdd] StaffConfig:`, cfg ? `bulundu, welcomeKanali=${cfg.welcomeKanali}` : 'bulunamadi');
      if (!cfg?.welcomeKanali) {
        console.log('[guildMemberAdd] welcomeKanali ayarlanmamis, cikiliyor.');
        return;
      }

      const kanal = guild.channels.cache.get(cfg.welcomeKanali);
      console.log(`[guildMemberAdd] Kanal:`, kanal ? `bulundu (${kanal.name})` : "cache'de bulunamadi");
      if (!kanal) return;

      const uyeSayisi        = guild.memberCount;
      const hesapOlusturma   = Math.floor(member.user.createdTimestamp / 1000);
      const katilma          = Math.floor(member.joinedTimestamp / 1000);
      const hesapYasi        = Date.now() - member.user.createdTimestamp;
      const yeniHesap        = hesapYasi < 7 * 24 * 60 * 60 * 1000; 

      const container = new ContainerBuilder();

      
      if (guild.banner) {
        container.addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(guild.bannerURL({ size: 1024, extension: 'png' }))
          )
        );
      }

      
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Hos Geldin, ${member}!\n` +
          `**${guild.name}** ailesine katildin. Seninle birlikte **${uyeSayisi}** kisi olduk.\n` +
          (yeniHesap ? '\n> Hesabın oldukça yeni görünüyor. Kurallara dikkat et.' : '')
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

      
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> Hesap olusturulma : <t:${hesapOlusturma}:D> (<t:${hesapOlusturma}:R>)\n` +
          `> Sunucuya katilma  : <t:${katilma}:R>`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

      
      const satirlar = [];
      if (cfg.teyitKanali) satirlar.push(`> Sunucuya erisim icin <#${cfg.teyitKanali}> kanalinda kayit olman gerekiyor.`);
      if (cfg.kayitKanali) satirlar.push(`> Kayit islemi icin <#${cfg.kayitKanali}> kanalini kullanabilirsin.`);
      satirlar.push('> Kurallara uymak zorunludur. Iyi eglenceler.');

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(satirlar.join('\n'))
      );

      
      const butonlar = new ActionRowBuilder();
      butonlar.addComponents(
        new ButtonBuilder()
          .setCustomId(`welcome_sicil_${member.id}`)
          .setLabel('Sicil Sorgula')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`welcome_yetkili_${member.id}`)
          .setLabel('Yetkili Cagir')
          .setStyle(ButtonStyle.Danger),
      );

      container.addActionRowComponents(butonlar);

      await kanal.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
      console.log('[guildMemberAdd] Welcome mesaji gonderildi.');
    } catch (err) {
      console.error('[guildMemberAdd] Welcome hatasi:', err);
    }
  },
};
