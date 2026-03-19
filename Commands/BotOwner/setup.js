const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
} = require('discord.js');
const TweetConfig      = require('../../global/models/TweetConfig');
const ConfessionConfig = require('../../global/models/ConfessionConfig');
const RoleMenuConfig   = require('../../global/models/RoleMenuConfig');
const StaffConfig      = require('../../global/models/StaffConfig');
const StreamerLbConfig = require('../../global/models/StreamerLbConfig');
const settings         = require('../../global/settings/settings.json');

function hasPerms(message) {
  return (
    message.author.id === settings.ownerID ||
    message.member.permissions.has('ManageGuild')
  );
}

function roleList(ids) {
  if (!ids || ids.length === 0) return '`-`';
  return ids.map(id => `<@&${id}>`).join(', ');
}

function singleRole(id) {
  return id ? `<@&${id}>` : '`-`';
}

async function buildMainMenu(guild) {
  const staffCfg = await StaffConfig.findOne({ guildId: guild.id });
  const tweetCfg = await TweetConfig.findOne({ guildId: guild.id });
  const confCfg  = await ConfessionConfig.findOne({ guildId: guild.id });
  const roleCfg  = await RoleMenuConfig.findOne({ guildId: guild.id });
  const ch = (id) => id ? `<#${id}>` : '`-`';

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## Sunucu Ayarlari')
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Uye Sistemi**\n' +
      `> Welcome         : ${ch(staffCfg?.welcomeKanali)}\n` +
      `> Kayit           : ${ch(staffCfg?.kayitKanali)}\n` +
      `> Kayit Log       : ${ch(staffCfg?.kayitLogKanali)}\n` +
      `> Teyit           : ${ch(staffCfg?.teyitKanali)}\n\n` +
      '**Log & Basvuru**\n' +
      `> Log             : ${ch(staffCfg?.logKanali)}\n` +
      `> Canvas Log      : ${ch(staffCfg?.canvasLogKanali)}\n` +
      `> Sorumluluk Bsv. : ${ch(staffCfg?.basvuruKanali)}\n` +
      `> Yetkili Bsv.    : ${ch(staffCfg?.yetkiliKanali)}\n` +
      `> Streamer Bsv.   : ${ch(staffCfg?.streamerKanali)}\n` +
      `> Sorun Cozme     : ${ch(staffCfg?.sorunKanali)}\n\n` +
      '**Icerik**\n' +
      `> Tweet           : ${ch(tweetCfg?.channelId)}\n` +
      `> Itiraf          : ${ch(confCfg?.channelId)}\n\n` +
      '**Diger**\n' +
      `> Rol Menusu      : ${roleCfg ? '`Ayarli`' : '`-`'}\n` +
      `> Sorumluluk      : ${staffCfg?.chat?.sorumluluk?.length ? '`Ayarli`' : '`-`'}\n` +
      `> Erkek Rolu      : ${staffCfg?.erkekRolu ? `<@&${staffCfg.erkekRolu}>` : '`-`'}\n` +
      `> Kiz Rolu        : ${staffCfg?.kizRolu ? `<@&${staffCfg.kizRolu}>` : '`-`'}\n` +
      `> Ortak Rol       : ${staffCfg?.ortakRolu ? `<@&${staffCfg.ortakRolu}>` : '`-`'}\n` +
      `> Kayitsiz Rol    : ${staffCfg?.kayitsizRolu ? `<@&${staffCfg.kayitsizRolu}>` : '`-`'}`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('setup_nav')
        .setPlaceholder('Bolum sec...')
        .addOptions(
          { label: 'Kanal Ayarlari',       value: 'channels',   description: 'Tum kanal ayarlarini yonet' },
          { label: 'Itiraf Ayarlari',      value: 'confession', description: 'Itiraf bildirim rolunu ayarla' },
          { label: 'Rol Menusu',           value: 'rolemenu',   description: 'Rol menusu kategorilerini ayarla' },
          { label: 'Sorumluluk Rolleri',   value: 'staff',      description: 'Yetkili rol kategorilerini ayarla' },
          { label: 'Kayit Rolleri',        value: 'kayitroles', description: 'Erkek, kiz ve ortak rollerini ayarla' },
          { label: 'Katagori Ayarla', value: 'streamerlb', description: 'Streamer LB Discord kategorilerini ayarla' },
        )
    )
  );
  return container;
}

async function buildChannelPage(guild) {
  const tweetCfg = await TweetConfig.findOne({ guildId: guild.id });
  const confCfg  = await ConfessionConfig.findOne({ guildId: guild.id });
  const staffCfg = await StaffConfig.findOne({ guildId: guild.id });
  const ch = (id) => id ? `<#${id}>` : '`-`';

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Kanal Ayarlari**\n\n' +
      '**Uye Sistemi**\n' +
      `> Welcome         : ${ch(staffCfg?.welcomeKanali)}\n` +
      `> Kayit           : ${ch(staffCfg?.kayitKanali)}\n` +
      `> Kayit Log       : ${ch(staffCfg?.kayitLogKanali)}\n` +
      `> Teyit           : ${ch(staffCfg?.teyitKanali)}\n\n` +
      '**Log & Basvuru**\n' +
      `> Log             : ${ch(staffCfg?.logKanali)}\n` +
      `> Canvas Log      : ${ch(staffCfg?.canvasLogKanali)}\n` +
      `> Sorumluluk Bsv. : ${ch(staffCfg?.basvuruKanali)}\n` +
      `> Yetkili Bsv.    : ${ch(staffCfg?.yetkiliKanali)}\n` +
      `> Streamer Bsv.   : ${ch(staffCfg?.streamerKanali)}\n` +
      `> Sorun Cozme     : ${ch(staffCfg?.sorunKanali)}\n\n` +
      '**Icerik**\n' +
      `> Tweet           : ${ch(tweetCfg?.channelId)}\n` +
      `> Itiraf          : ${ch(confCfg?.channelId)}`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('setup_channel_cat')
        .setPlaceholder('Hangi kanali ayarlamak istiyorsun?')
        .addOptions(
          { label: 'Welcome Kanali',         value: 'welcome',  description: 'Uye girisinde mesaj atilacak kanal' },
          { label: 'Kayit Kanali',           value: 'kayit',    description: 'Kayit komutunun kullanilacagi kanal' },
          { label: 'Kayit Log Kanali',       value: 'kayitlog', description: 'Kayit loglarinin dusecegi kanal' },
          { label: 'Teyit Kanali',           value: 'teyit',    description: 'Kayit teyit kanali' },
          { label: 'Log Kanali',             value: 'log',        description: 'Genel log kanali' },
          { label: 'Canvas Log Kanali',      value: 'canvaslog',  description: 'Canvas resimlerinin yuklenecegi kanal' },
          { label: 'Sorumluluk Basvuru',     value: 'basvuru',    description: 'Sorumluluk basvuru kanali' },
          { label: 'Yetkili Basvuru',        value: 'yetkili',  description: 'Yetkili basvuru kanali' },
          { label: 'Streamer Basvuru',       value: 'streamer', description: 'Streamer basvuru kanali' },
          { label: 'Sorun Cozme',            value: 'sorun',    description: 'Sorun cozme kanali' },
          { label: 'Tweet Kanali',           value: 'tweet',    description: 'Tweet kanali' },
          { label: 'Itiraf Kanali',          value: 'conf',     description: 'Itiraf kanali' },
          { label: 'Kanallari Otomatik Kur', value: 'ch_auto',  description: 'Tum kanallari otomatik olustur' },
        )
    )
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('setup_nav').setPlaceholder('Geri don...').addOptions(
        { label: 'Ana Menu', value: 'main' },
      )
    )
  );
  return container;
}

function buildChannelSubPage(key, currentId, label) {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `**${label}**\n` +
      `> Mevcut : ${currentId ? `<#${currentId}>` : '`Ayarlanmamis`'}`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`setup_channel_${key}`)
        .setPlaceholder(`${label} sec...`)
        .setChannelTypes(ChannelType.GuildText)
    )
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('setup_nav').setPlaceholder('Geri don...').addOptions(
        { label: 'Kanal Ayarlari', value: 'channels' },
        { label: 'Ana Menu',       value: 'main' },
      )
    )
  );
  return container;
}

function buildConfessionPage(confCfg) {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Itiraf Rol Ayari**\n' +
      `> Itiraf Kanali : ${confCfg?.channelId ? `<#${confCfg.channelId}>` : '`-`'}\n` +
      `> Bildirim Rolu : ${singleRole(confCfg?.roleId)}\n\n` +
      `> Kanal degistirmek icin Kanal Ayarlari sekmesini kullan.`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('setup_conf_role')
        .setPlaceholder('Bildirim rolunu sec (opsiyonel)...')
    )
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('setup_nav').setPlaceholder('Islem sec...').addOptions(
        { label: 'Ana Menu',              value: 'main' },
        { label: 'Kanal Ayarlari',        value: 'channels' },
        { label: 'Itiraf Ayarlarini Sil', value: 'conf_reset' },
      )
    )
  );
  return container;
}

function buildRoleMenuPage(cfg) {
  const e = cfg?.etkinlik || {};
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('**Rol Menusu Ayarlari**')
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> Etkinlik - Cekilis  : ${singleRole(e.cekilis)}\n` +
      `> Etkinlik - Etkinlik : ${singleRole(e.etkinlik)}\n` +
      `> Etkinlik - Coin     : ${singleRole(e.coin)}\n` +
      `> Etkinlik - Sosyal   : ${singleRole(e.sosyal)}\n` +
      `> Takim Rolleri       : ${roleList(cfg?.takim)}\n` +
      `> Renk Rolleri        : ${roleList(cfg?.renk)}\n` +
      `> Iliski Rolleri      : ${roleList(cfg?.iliski)}\n` +
      `> Oyun Rolleri        : ${roleList(cfg?.oyun)}\n` +
      `> Burc Rolleri        : ${roleList(cfg?.burc)}`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('setup_rolemenu_cat').setPlaceholder('Kategori sec...').addOptions(
        { label: 'Etkinlik Rolleri',     value: 'etkinlik',    description: 'Cekilis, etkinlik, coin, sosyal' },
        { label: 'Takim Rolleri',        value: 'takim',       description: 'Besiktas, Trabzon, FB, GS' },
        { label: 'Renk Rolleri',         value: 'renk',        description: 'Renk rolleri' },
        { label: 'Iliski Rolleri',       value: 'iliski',      description: 'Iliski durumu rolleri' },
        { label: 'Oyun Rolleri',         value: 'oyun',        description: 'Oyun rolleri' },
        { label: 'Burc Rolleri',         value: 'burc',        description: 'Burc rolleri' },
        { label: 'Rolleri Otomatik Kur', value: 'auto_create', description: 'Tum rolleri sunucuda olustur' },
        { label: 'Rolleri Sil',          value: 'auto_delete', description: 'Tum rol menusu rollerini sil' },
      )
    )
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('setup_nav').setPlaceholder('Geri don...').addOptions(
        { label: 'Ana Menu',        value: 'main' },
        { label: 'Itiraf Ayarlari', value: 'confession' },
      )
    )
  );
  return container;
}

function buildRoleCatPage(cat, cfg) {
  const labels = {
    etkinlik: 'Etkinlik Rolleri', takim: 'Takim Rolleri', renk: 'Renk Rolleri',
    iliski: 'Iliski Rolleri', oyun: 'Oyun Rolleri', burc: 'Burc Rolleri',
  };
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`**${labels[cat]}**`)
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  if (cat === 'etkinlik') {
    const e = cfg?.etkinlik || {};
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> Cekilis Duyurusu  : ${singleRole(e.cekilis)}\n` +
        `> Etkinlik Duyurusu : ${singleRole(e.etkinlik)}\n` +
        `> Coin Bildirim     : ${singleRole(e.coin)}\n` +
        `> Sosyal Etkinlik   : ${singleRole(e.sosyal)}`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    for (const [key, label] of [['cekilis','Cekilis Duyurusu'],['etkinlik','Etkinlik Duyurusu'],['coin','Coin Bildirim'],['sosyal','Sosyal Etkinlik']]) {
      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId(`setup_rm_etkinlik_${key}`)
            .setPlaceholder(`${label} rolunu sec...`)
        )
      );
    }
  } else {
    const current = cfg?.[cat] || [];
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`> Mevcut : ${roleList(current)}`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`setup_rm_${cat}`)
          .setPlaceholder(`${labels[cat]} sec (coklu)...`)
          .setMinValues(1)
          .setMaxValues(25)
      )
    );
  }
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('setup_nav').setPlaceholder('Geri don...').addOptions(
        { label: 'Rol Menusu', value: 'rolemenu' },
        { label: 'Ana Menu',   value: 'main' },
      )
    )
  );
  return container;
}

const STAFF_CATS = [
  { value: 'chat',         label: 'Chat',         desc: 'Mute warn voicemute komutlari' },
  { value: 'ban_jail',     label: 'Ban / Jail',   desc: 'Ban ve jail atar' },
  { value: 'mute',         label: 'Mute',         desc: 'Ses ve chat mute' },
  { value: 'yetkili_alim', label: 'Yetkili Alim', desc: 'Yetkili alim yapabilir' },
  { value: 'rol_denetim',  label: 'Rol Denetim',  desc: 'Rolleri denetler' },
  { value: 'register',     label: 'Register',     desc: 'Kayit komutlarini kullanabilir' },
  { value: 'streamer',     label: 'Streamer',     desc: 'Streamer basvurularini yonetir' },
  { value: 'konser',       label: 'Konser',       desc: 'Konser kategorisi yetkilisi' },
  { value: 'sorun_cozme',  label: 'Sorun Cozme',  desc: 'Sorun cozme islerine bakar' },
  { value: 'etkinlik',     label: 'Etkinlik',     desc: 'Etkinlik baslatabilir' },
  { value: 'public',       label: 'Public',       desc: 'Public kategorisine erisim' },
  { value: 'ceza_rolu',    label: 'Ceza Rolu',    desc: 'Ban atilinca verilen rol (tekli)' },
];

const STAFF_AUTO_ROLES = [
  { key: 'chat',         kademeler: [{ k: 'sorumluluk', name: 'Chat Sorumluluk',         color: 0xf1c40f }, { k: 'denetim', name: 'Chat Denetimci',         color: 0x2ecc71 }, { k: 'lider', name: 'Chat Liderlik',         color: 0xe74c3c }] },
  { key: 'ban_jail',     kademeler: [{ k: 'sorumluluk', name: 'Ban/Jail Sorumluluk',      color: 0xf1c40f }, { k: 'denetim', name: 'Ban/Jail Denetimci',      color: 0x2ecc71 }, { k: 'lider', name: 'Ban/Jail Liderlik',      color: 0xe74c3c }] },
  { key: 'mute',         kademeler: [{ k: 'sorumluluk', name: 'Mute Sorumluluk',          color: 0xf1c40f }, { k: 'denetim', name: 'Mute Denetimci',          color: 0x2ecc71 }, { k: 'lider', name: 'Mute Liderlik',          color: 0xe74c3c }] },
  { key: 'yetkili_alim', kademeler: [{ k: 'sorumluluk', name: 'Yetkili Alim Sorumluluk', color: 0xf1c40f }, { k: 'denetim', name: 'Yetkili Alim Denetimci', color: 0x2ecc71 }, { k: 'lider', name: 'Yetkili Alim Liderlik', color: 0xe74c3c }] },
  { key: 'rol_denetim',  kademeler: [{ k: 'sorumluluk', name: 'Rol Denetim Sorumluluk',  color: 0xf1c40f }, { k: 'denetim', name: 'Rol Denetim Denetimci',  color: 0x2ecc71 }, { k: 'lider', name: 'Rol Denetim Liderlik',  color: 0xe74c3c }] },
  { key: 'register',     kademeler: [{ k: 'sorumluluk', name: 'Register Sorumluluk',      color: 0xf1c40f }, { k: 'denetim', name: 'Register Denetimci',      color: 0x2ecc71 }, { k: 'lider', name: 'Register Liderlik',      color: 0xe74c3c }] },
  { key: 'streamer',     kademeler: [{ k: 'sorumluluk', name: 'Streamer Sorumluluk',      color: 0xf1c40f }, { k: 'denetim', name: 'Streamer Denetimci',      color: 0x2ecc71 }, { k: 'lider', name: 'Streamer Liderlik',      color: 0xe74c3c }] },
  { key: 'konser',       kademeler: [{ k: 'sorumluluk', name: 'Konser Sorumluluk',        color: 0xf1c40f }, { k: 'denetim', name: 'Konser Denetimci',        color: 0x2ecc71 }, { k: 'lider', name: 'Konser Liderlik',        color: 0xe74c3c }] },
  { key: 'sorun_cozme',  kademeler: [{ k: 'sorumluluk', name: 'Sorun Cozme Sorumluluk',  color: 0xf1c40f }, { k: 'denetim', name: 'Sorun Cozme Denetimci',  color: 0x2ecc71 }, { k: 'lider', name: 'Sorun Cozme Liderlik',  color: 0xe74c3c }] },
  { key: 'etkinlik',     kademeler: [{ k: 'sorumluluk', name: 'Etkinlik Sorumluluk',      color: 0xf1c40f }, { k: 'denetim', name: 'Etkinlik Denetimci',      color: 0x2ecc71 }, { k: 'lider', name: 'Etkinlik Liderlik',      color: 0xe74c3c }] },
  { key: 'public',       kademeler: [{ k: 'sorumluluk', name: 'Public Sorumluluk',        color: 0xf1c40f }, { k: 'denetim', name: 'Public Denetimci',        color: 0x2ecc71 }, { k: 'lider', name: 'Public Liderlik',        color: 0xe74c3c }] },
  { key: 'ceza_rolu',    kademeler: null },
];

async function buildStaffPage(guild) {
  const cfg = await StaffConfig.findOne({ guildId: guild.id });
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Sorumluluk Ayarlari**\n' +
      `> Basvuru Kanali : ${cfg?.basvuruKanali ? `<#${cfg.basvuruKanali}>` : '`-` — Kanal Ayarlari sekmesinden ayarla'}`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  const lines = STAFF_CATS.map(c => {
    if (c.value === 'ceza_rolu') {
      return `> Ceza Rolu : ${cfg?.ceza_rolu ? `<@&${cfg.ceza_rolu}>` : '`-`'}`;
    }
    const alan = cfg?.[c.value] || {};
    const s = (alan.sorumluluk || []).map(id => `<@&${id}>`).join(' ') || '`-`';
    const d = (alan.denetim    || []).map(id => `<@&${id}>`).join(' ') || '`-`';
    const l = (alan.lider      || []).map(id => `<@&${id}>`).join(' ') || '`-`';
    return `> **${c.label}** — S: ${s} | D: ${d} | L: ${l}`;
  });
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(lines.join('\n'))
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('setup_staff_cat')
        .setPlaceholder('Alan sec (1/2)...')
        .addOptions(STAFF_CATS.slice(0, 6).map(c => ({ label: c.label, value: c.value, description: c.desc })))
    )
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('setup_staff_cat2')
        .setPlaceholder('Alan sec (2/2)...')
        .addOptions(STAFF_CATS.slice(6).map(c => ({ label: c.label, value: c.value, description: c.desc })))
    )
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('setup_nav').setPlaceholder('Islem sec...').addOptions(
        { label: 'Ana Menu',             value: 'main' },
        { label: 'Rolleri Otomatik Kur', value: 'staff_create' },
        { label: 'Rolleri Sil',          value: 'staff_delete' },
      )
    )
  );
  return container;
}

function buildStaffCatPage(cat, cfg) {
  const info = STAFF_CATS.find(c => c.value === cat);
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`**${info.label}**\n> ${info.desc}`)
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  if (cat === 'ceza_rolu') {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> Mevcut : ${cfg?.ceza_rolu ? `<@&${cfg.ceza_rolu}>` : '`-`'}`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId('setup_staff_role_ceza_rolu__single')
          .setPlaceholder('Ceza rolunu sec...')
      )
    );
  } else {
    const alan = cfg?.[cat] || {};
    const fmt = (ids) => (ids || []).length > 0 ? ids.map(id => `<@&${id}>`).join(', ') : '`-`';
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> Sorumlu   : ${fmt(alan.sorumluluk)}\n` +
        `> Denetimci : ${fmt(alan.denetim)}\n` +
        `> Lider     : ${fmt(alan.lider)}`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    for (const [kademe, label] of [['sorumluluk','Sorumlu'],['denetim','Denetimci'],['lider','Lider']]) {
      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId(`setup_staff_role_${cat}__${kademe}`)
            .setPlaceholder(`${label} rollerini sec...`)
            .setMinValues(1)
            .setMaxValues(10)
        )
      );
    }
  }
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('setup_nav').setPlaceholder('Geri don...').addOptions(
        { label: 'Sorumluluk Ana Sayfa', value: 'staff' },
        { label: 'Ana Menu',             value: 'main' },
      )
    )
  );
  return container;
}

async function buildKayitRolesPage(guild) {
  const cfg = await StaffConfig.findOne({ guildId: guild.id });
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Kayit Rolleri**\n' +
      '> Kayit komutunda kullanilacak roller.\n' +
      '> Ortak rol opsiyoneldir — ayarlanirsa her iki cinse de verilir.\n' +
      '> Kayitsiz rol opsiyoneldir — sunucuya yeni gelen kayitsiz uyelere verilir.\n\n' +
      `> Erkek Rolu    : ${cfg?.erkekRolu    ? `<@&${cfg.erkekRolu}>`    : '`Ayarlanmamis`'}\n` +
      `> Kiz Rolu      : ${cfg?.kizRolu      ? `<@&${cfg.kizRolu}>`      : '`Ayarlanmamis`'}\n` +
      `> Ortak Rol     : ${cfg?.ortakRolu    ? `<@&${cfg.ortakRolu}>`    : '`Ayarlanmamis (opsiyonel)`'}\n` +
      `> Kayitsiz Rol  : ${cfg?.kayitsizRolu ? `<@&${cfg.kayitsizRolu}>` : '`Ayarlanmamis (opsiyonel)`'}`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  for (const [key, label] of [
    ['erkekRolu',    'Erkek Rolu'],
    ['kizRolu',      'Kiz Rolu'],
    ['ortakRolu',    'Ortak Rol (opsiyonel)'],
    ['kayitsizRolu', 'Kayitsiz Rol (opsiyonel)'],
  ]) {
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`setup_kayitrole_${key}`)
          .setPlaceholder(`${label} sec...`)
      )
    );
  }
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('setup_nav').setPlaceholder('Geri don...').addOptions(
        { label: 'Ana Menu', value: 'main' },
      )
    )
  );
  return container;
}

const SLB_CATS = [
  { key: 'kayit',       label: 'Kayit'       },
  { key: 'public',      label: 'Public'      },
  { key: 'streamer',    label: 'Streamer'    },
  { key: 'sorun_cozme', label: 'Sorun Cozme' },
  { key: 'secret',      label: 'Secret'      },
  { key: 'private',     label: 'Private'     },
];

async function buildStreamerLbPage(guild) {
  const cfg = await StreamerLbConfig.findOne({ guildId: guild.id });
  const fmt = (val) => {
    if (!val) return '`-`';
    const ch = guild.channels.cache.get(val);
    return ch ? `${ch.name} (\`${val}\`)` : `\`${val}\``;
  };
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Streamer Leaderboard — Kategori Ayarlari**\n' +
      '> Her satir icin Discord kategorisi (parent) sec.\n' +
      '> O parent altindaki tum ses kanallari otomatik sayilir.\n\n' +
      SLB_CATS.map(c => `> **${c.label}** : ${fmt(cfg?.[c.key])}`).join('\n')
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('setup_slb_cat')
        .setPlaceholder('Kategori sec...')
        .addOptions(SLB_CATS.map(c => ({ label: c.label, value: c.key, description: `${c.label} parent adini ayarla` })))
    )
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('setup_nav').setPlaceholder('Geri don...').addOptions(
        { label: 'Ana Menu', value: 'main' },
      )
    )
  );
  return container;
}

function buildStreamerLbCatPage(cat, cfg) {
  const info   = SLB_CATS.find(c => c.key === cat);
  const val    = cfg?.[cat];
  const mevcut = val ? `\`${val}\`` : '`-`';
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `**${info.label} — Discord Kategorisi**\n` +
      `> Mevcut: ${mevcut}\n\n` +
      `Asagidan bir Discord kategorisi (parent) sec.\n` +
      `O kategori altindaki tum ses kanallari bu LB kategorisine sayilir.`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`setup_slb_ch_${cat}`)
        .setPlaceholder('Discord kategorisi sec...')
        .setChannelTypes(ChannelType.GuildCategory)
    )
  );
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('setup_nav').setPlaceholder('Geri don...').addOptions(
        { label: 'Streamer LB Ayarlari', value: 'streamerlb' },
        { label: 'Ana Menu',             value: 'main' },
      )
    )
  );
  return container;
}

module.exports = {
  name: 'setup',
  description: 'Sunucu ayarlarini yapar.',
  usage: '.setup',
  aliases: [],
  category: 'BotOwner',

  async execute(message, _args, _focus) {
    if (!hasPerms(message))
      return message.reply('Bu komutu kullanmak icin Sunucuyu Yonet yetkisi gerekli.');

    const container = await buildMainMenu(message.guild);
    const sent = await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });

    const collector = sent.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 300_000,
    });

    collector.on('collect', async interaction => {
      const id = interaction.customId;

      
      if (id === 'setup_nav') {
        const val = interaction.values[0];

        if (val === 'main')
          return interaction.update({ components: [await buildMainMenu(message.guild)], flags: MessageFlags.IsComponentsV2 });

        if (val === 'channels')
          return interaction.update({ components: [await buildChannelPage(message.guild)], flags: MessageFlags.IsComponentsV2 });

        if (val === 'confession') {
          const cfg = await ConfessionConfig.findOne({ guildId: message.guild.id });
          return interaction.update({ components: [buildConfessionPage(cfg)], flags: MessageFlags.IsComponentsV2 });
        }

        if (val === 'rolemenu') {
          const cfg = await RoleMenuConfig.findOne({ guildId: message.guild.id });
          return interaction.update({ components: [buildRoleMenuPage(cfg)], flags: MessageFlags.IsComponentsV2 });
        }

        if (val === 'staff')
          return interaction.update({ components: [await buildStaffPage(message.guild)], flags: MessageFlags.IsComponentsV2 });

        if (val === 'streamerlb')
          return interaction.update({ components: [await buildStreamerLbPage(message.guild)], flags: MessageFlags.IsComponentsV2 });

        if (val === 'kayitroles')
          return interaction.update({ components: [await buildKayitRolesPage(message.guild)], flags: MessageFlags.IsComponentsV2 });

        if (val === 'conf_reset') {
          await ConfessionConfig.findOneAndUpdate({ guildId: message.guild.id }, { channelId: null, roleId: null }, { upsert: true });
          return interaction.update({ components: [buildConfessionPage(null)], flags: MessageFlags.IsComponentsV2 });
        }

        if (val === 'staff_create') {
          await interaction.deferUpdate();
          const getOrCreate = async (name, color) => {
            await message.guild.roles.fetch().catch(() => {});
            return message.guild.roles.cache.find(r => r.name === name) ||
              await message.guild.roles.create({ name, color, reason: 'Sorumluluk otomatik kurulum' });
          };
          const liderIds = [], denetimIds = [], sorumlulukIds = [];
          const sepL = await getOrCreate('── Liderlikler ──', 0x2c2f33); liderIds.push(sepL.id);
          for (const r of STAFF_AUTO_ROLES) {
            if (!r.kademeler) continue;
            const km = r.kademeler.find(k => k.k === 'lider');
            if (!km) continue;
            const role = await getOrCreate(km.name, km.color);
            await StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { [`${r.key}.lider`]: [role.id] }, { upsert: true });
            liderIds.push(role.id);
          }
          const sepD = await getOrCreate('── Denetimler ──', 0x2c2f33); denetimIds.push(sepD.id);
          for (const r of STAFF_AUTO_ROLES) {
            if (!r.kademeler) continue;
            const km = r.kademeler.find(k => k.k === 'denetim');
            if (!km) continue;
            const role = await getOrCreate(km.name, km.color);
            await StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { [`${r.key}.denetim`]: [role.id] }, { upsert: true });
            denetimIds.push(role.id);
          }
          const sepS = await getOrCreate('── Sorumluluklar ──', 0x2c2f33); sorumlulukIds.push(sepS.id);
          for (const r of STAFF_AUTO_ROLES) {
            if (!r.kademeler) continue;
            const km = r.kademeler.find(k => k.k === 'sorumluluk');
            if (!km) continue;
            const role = await getOrCreate(km.name, km.color);
            await StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { [`${r.key}.sorumluluk`]: [role.id] }, { upsert: true });
            sorumlulukIds.push(role.id);
          }
          const cezaRole = await getOrCreate('Cezali', 0x7f8c8d);
          await StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { ceza_rolu: cezaRole.id }, { upsert: true });
          const orderedIds = [cezaRole.id, ...sorumlulukIds, ...denetimIds, ...liderIds];
          await message.guild.roles.setPositions(orderedIds.map((rid, idx) => ({ role: rid, position: idx + 1 }))).catch(() => {});
          return interaction.editReply({ components: [await buildStaffPage(message.guild)], flags: MessageFlags.IsComponentsV2 });
        }

        if (val === 'staff_delete') {
          await interaction.deferUpdate();
          const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
          if (cfg) {
            const allIds = [cfg.ceza_rolu];
            for (const r of STAFF_AUTO_ROLES) {
              if (!r.kademeler) continue;
              const alan = cfg[r.key] || {};
              allIds.push(...(alan.sorumluluk || []), ...(alan.denetim || []), ...(alan.lider || []));
            }
            for (const roleId of allIds.filter(Boolean)) {
              const role = message.guild.roles.cache.get(roleId);
              if (role) await role.delete('Sorumluluk rolleri silindi').catch(() => {});
            }
            await StaffConfig.deleteOne({ guildId: message.guild.id });
          }
          return interaction.editReply({ components: [await buildStaffPage(message.guild)], flags: MessageFlags.IsComponentsV2 });
        }
      }

      
      if (id === 'setup_channel_cat') {
        const cat = interaction.values[0];

        if (cat === 'ch_auto') {
          await interaction.deferUpdate();
          const everyoneId = message.guild.roles.everyone.id;

          
          const existingLogCat = message.guild.channels.cache.find(c => c.name === 'Loglar' && c.type === 4);
          const logCategory = existingLogCat || await message.guild.channels.create({
            name: 'Loglar', type: 4,
            permissionOverwrites: [{ id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] }],
            reason: 'Otomatik log kategorisi',
          });

          const LOG_CHANNELS = [
            { name: 'log',                dbKey: 'logKanali' },
            { name: 'sorumluluk-basvuru', dbKey: 'basvuruKanali' },
            { name: 'yetkili-basvuru',    dbKey: 'yetkiliKanali' },
            { name: 'streamer-basvuru',   dbKey: 'streamerKanali' },
            { name: 'sorun-cozme',        dbKey: 'sorunKanali' },
            { name: 'kayit-log',          dbKey: 'kayitLogKanali' },
          ];
          for (const ch of LOG_CHANNELS) {
            const existing = message.guild.channels.cache.find(c => c.name === ch.name && c.type === 0);
            const channel = existing || await message.guild.channels.create({
              name: ch.name, type: 0, parent: logCategory.id,
              permissionOverwrites: [{ id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] }],
              reason: 'Otomatik kanal kurulumu',
            });
            if (existing && existing.parentId !== logCategory.id) {
              await existing.setParent(logCategory.id, { lockPermissions: false }).catch(() => {});
              await existing.permissionOverwrites.edit(everyoneId, { ViewChannel: false }).catch(() => {});
            }
            await StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { [ch.dbKey]: channel.id }, { upsert: true });
          }

          
          const UYE_CHANNELS = [
            { name: 'welcome',  dbKey: 'welcomeKanali',  model: 'staff' },
            { name: 'kayit',    dbKey: 'kayitKanali',    model: 'staff' },
            { name: 'teyit',    dbKey: 'teyitKanali',    model: 'staff' },
          ];
          for (const ch of UYE_CHANNELS) {
            const existing = message.guild.channels.cache.find(c => c.name === ch.name && c.type === 0);
            const channel = existing || await message.guild.channels.create({
              name: ch.name, type: 0, reason: 'Otomatik kanal kurulumu',
            });
            await StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { [ch.dbKey]: channel.id }, { upsert: true });
          }

          
          const tweetCh = message.guild.channels.cache.find(c => c.name === 'tweet' && c.type === 0) ||
            await message.guild.channels.create({ name: 'tweet', type: 0, reason: 'Otomatik kanal kurulumu' });
          await TweetConfig.findOneAndUpdate({ guildId: message.guild.id }, { channelId: tweetCh.id }, { upsert: true });

          const itirafCh = message.guild.channels.cache.find(c => c.name === 'itiraf' && c.type === 0) ||
            await message.guild.channels.create({ name: 'itiraf', type: 0, reason: 'Otomatik kanal kurulumu' });
          await ConfessionConfig.findOneAndUpdate({ guildId: message.guild.id }, { channelId: itirafCh.id }, { upsert: true });

          return interaction.editReply({ components: [await buildChannelPage(message.guild)], flags: MessageFlags.IsComponentsV2 });
        }

        const staffCfg = await StaffConfig.findOne({ guildId: message.guild.id });
        const tweetCfg = await TweetConfig.findOne({ guildId: message.guild.id });
        const confCfg  = await ConfessionConfig.findOne({ guildId: message.guild.id });

        const subPages = {
          welcome:  { label: 'Welcome Kanali',     id: staffCfg?.welcomeKanali },
          kayit:    { label: 'Kayit Kanali',        id: staffCfg?.kayitKanali },
          kayitlog: { label: 'Kayit Log Kanali',    id: staffCfg?.kayitLogKanali },
          teyit:    { label: 'Teyit Kanali',        id: staffCfg?.teyitKanali },
          log:      { label: 'Log Kanali',          id: staffCfg?.logKanali },
          canvaslog:{ label: 'Canvas Log Kanali',   id: staffCfg?.canvasLogKanali },
          basvuru:  { label: 'Sorumluluk Basvuru',  id: staffCfg?.basvuruKanali },
          yetkili:  { label: 'Yetkili Basvuru',     id: staffCfg?.yetkiliKanali },
          streamer: { label: 'Streamer Basvuru',    id: staffCfg?.streamerKanali },
          sorun:    { label: 'Sorun Cozme',         id: staffCfg?.sorunKanali },
          tweet:    { label: 'Tweet Kanali',        id: tweetCfg?.channelId },
          conf:     { label: 'Itiraf Kanali',       id: confCfg?.channelId },
        };

        const page = subPages[cat];
        if (page) return interaction.update({ components: [buildChannelSubPage(cat, page.id, page.label)], flags: MessageFlags.IsComponentsV2 });
      }

      
      if (id.startsWith('setup_channel_') && !id.startsWith('setup_channel_cat')) {
        const key = id.replace('setup_channel_', '');
        const channelId = interaction.values[0];
        const keyMap = {
          welcome:  async () => StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { welcomeKanali: channelId }, { upsert: true }),
          kayit:    async () => StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { kayitKanali: channelId }, { upsert: true }),
          kayitlog: async () => StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { kayitLogKanali: channelId }, { upsert: true }),
          teyit:    async () => StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { teyitKanali: channelId }, { upsert: true }),
          log:      async () => StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { logKanali: channelId }, { upsert: true }),
          canvaslog:async () => StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { canvasLogKanali: channelId }, { upsert: true }),
          basvuru:  async () => StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { basvuruKanali: channelId }, { upsert: true }),
          yetkili:  async () => StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { yetkiliKanali: channelId }, { upsert: true }),
          streamer: async () => StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { streamerKanali: channelId }, { upsert: true }),
          sorun:    async () => StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { sorunKanali: channelId }, { upsert: true }),
          tweet:    async () => TweetConfig.findOneAndUpdate({ guildId: message.guild.id }, { channelId }, { upsert: true }),
          conf:     async () => ConfessionConfig.findOneAndUpdate({ guildId: message.guild.id }, { channelId }, { upsert: true }),
        };
        if (keyMap[key]) {
          await keyMap[key]();
          return interaction.update({ components: [await buildChannelPage(message.guild)], flags: MessageFlags.IsComponentsV2 });
        }
      }

      
      if (id.startsWith('setup_kayitrole_')) {
        const key = id.replace('setup_kayitrole_', '');
        await StaffConfig.findOneAndUpdate(
          { guildId: message.guild.id },
          { [key]: interaction.values[0] },
          { upsert: true }
        );
        return interaction.update({ components: [await buildKayitRolesPage(message.guild)], flags: MessageFlags.IsComponentsV2 });
      }

      
      if (id === 'setup_conf_role') {
        await ConfessionConfig.findOneAndUpdate({ guildId: message.guild.id }, { roleId: interaction.values[0] }, { upsert: true });
        const cfg = await ConfessionConfig.findOne({ guildId: message.guild.id });
        return interaction.update({ components: [buildConfessionPage(cfg)], flags: MessageFlags.IsComponentsV2 });
      }

      
      if (id === 'setup_rolemenu_cat') {
        const cat = interaction.values[0];

        if (cat === 'auto_delete') {
          await interaction.deferUpdate();
          const cfg = await RoleMenuConfig.findOne({ guildId: message.guild.id });
          if (cfg) {
            const e = cfg.etkinlik || {};
            const allIds = [e.cekilis, e.etkinlik, e.coin, e.sosyal,
              ...(cfg.takim || []), ...(cfg.renk || []), ...(cfg.iliski || []),
              ...(cfg.oyun || []), ...(cfg.burc || [])].filter(Boolean);
            for (const roleId of allIds) {
              const role = message.guild.roles.cache.get(roleId);
              if (role) await role.delete('Rol menusu silindi').catch(() => {});
            }
            await RoleMenuConfig.deleteOne({ guildId: message.guild.id });
          }
          return interaction.editReply({ components: [buildRoleMenuPage(null)], flags: MessageFlags.IsComponentsV2 });
        }

        if (cat === 'auto_create') {
          await interaction.deferUpdate();
          const ROLLER = {
            etkinlik: [
              { key: 'cekilis',  name: 'Cekilis Duyurusu', color: 0x2ecc71 },
              { key: 'etkinlik', name: 'Etkinlik Duyurusu', color: 0x3498db },
              { key: 'coin',     name: 'Coin Bildirim',     color: 0xf1c40f },
              { key: 'sosyal',   name: 'Sosyal Etkinlik',   color: 0xe67e22 },
            ],
            takim:  [{ name: 'Besiktas', color: 0x000000 }, { name: 'Trabzonspor', color: 0xb22222 }, { name: 'Fenerbahce', color: 0xffd700 }, { name: 'Galatasaray', color: 0xff4500 }],
            renk:   [{ name: 'Beyaz', color: 0xffffff }, { name: 'Siyah', color: 0x23272a }, { name: 'Mavi', color: 0x3498db }, { name: 'Yesil', color: 0x2ecc71 }, { name: 'Sari', color: 0xf1c40f }, { name: 'Mor', color: 0x9b59b6 }],
            iliski: [{ name: 'Sevgilim Var', color: 0xff69b4 }, { name: 'Sevgilim Yok', color: 0x95a5a6 }, { name: 'Sevgili Yapmiyorum', color: 0x7f8c8d }],
            oyun:   [{ name: 'Valorant', color: 0xff4655 }, { name: 'CS:GO', color: 0xf0a500 }, { name: 'PUBG', color: 0xf5a623 }, { name: 'Minecraft', color: 0x5b8731 }, { name: 'FiveM', color: 0x2980b9 }],
            burc:   [
              { name: 'Koc', color: 0xe74c3c }, { name: 'Boga', color: 0x27ae60 }, { name: 'Ikizler', color: 0xf39c12 },
              { name: 'Yengec', color: 0x2980b9 }, { name: 'Aslan', color: 0xf1c40f }, { name: 'Basak', color: 0x8e44ad },
              { name: 'Terazi', color: 0x16a085 }, { name: 'Akrep', color: 0xc0392b }, { name: 'Yay', color: 0xd35400 },
              { name: 'Oglak', color: 0x7f8c8d }, { name: 'Kova', color: 0x2c3e50 }, { name: 'Balik', color: 0x1abc9c },
            ],
          };
          const update = { etkinlik: {} };
          for (const r of ROLLER.etkinlik) {
            const existing = message.guild.roles.cache.find(ro => ro.name === r.name);
            const role = existing || await message.guild.roles.create({ name: r.name, color: r.color, reason: 'Rol menusu otomatik kurulum' });
            update.etkinlik[r.key] = role.id;
          }
          for (const catKey of ['takim', 'renk', 'iliski', 'oyun', 'burc']) {
            update[catKey] = [];
            for (const r of ROLLER[catKey]) {
              const existing = message.guild.roles.cache.find(ro => ro.name === r.name);
              const role = existing || await message.guild.roles.create({ name: r.name, color: r.color, reason: 'Rol menusu otomatik kurulum' });
              update[catKey].push(role.id);
            }
          }
          await RoleMenuConfig.findOneAndUpdate({ guildId: message.guild.id }, update, { upsert: true });
          const cfg = await RoleMenuConfig.findOne({ guildId: message.guild.id });
          return interaction.editReply({ components: [buildRoleMenuPage(cfg)], flags: MessageFlags.IsComponentsV2 });
        }

        const cfg = await RoleMenuConfig.findOne({ guildId: message.guild.id });
        return interaction.update({ components: [buildRoleCatPage(cat, cfg)], flags: MessageFlags.IsComponentsV2 });
      }

      
      if (id.startsWith('setup_rm_etkinlik_')) {
        const key = id.replace('setup_rm_etkinlik_', '');
        await RoleMenuConfig.findOneAndUpdate({ guildId: message.guild.id }, { [`etkinlik.${key}`]: interaction.values[0] }, { upsert: true });
        const cfg = await RoleMenuConfig.findOne({ guildId: message.guild.id });
        return interaction.update({ components: [buildRoleCatPage('etkinlik', cfg)], flags: MessageFlags.IsComponentsV2 });
      }

      
      if (id.startsWith('setup_rm_')) {
        const cat = id.replace('setup_rm_', '');
        await RoleMenuConfig.findOneAndUpdate({ guildId: message.guild.id }, { [cat]: interaction.values }, { upsert: true });
        const cfg = await RoleMenuConfig.findOne({ guildId: message.guild.id });
        return interaction.update({ components: [buildRoleCatPage(cat, cfg)], flags: MessageFlags.IsComponentsV2 });
      }

      
      if (id === 'setup_slb_cat') {
        const cat = interaction.values[0];
        const cfg = await StreamerLbConfig.findOne({ guildId: message.guild.id });
        return interaction.update({ components: [buildStreamerLbCatPage(cat, cfg)], flags: MessageFlags.IsComponentsV2 });
      }

      
      if (id.startsWith('setup_slb_ch_')) {
        const cat = id.replace('setup_slb_ch_', '');
        const channelId = interaction.values[0];
        await StreamerLbConfig.findOneAndUpdate(
          { guildId: message.guild.id },
          { [cat]: channelId },
          { upsert: true }
        );
        return interaction.update({ components: [await buildStreamerLbPage(message.guild)], flags: MessageFlags.IsComponentsV2 });
      }

      
      if (id === 'setup_staff_cat' || id === 'setup_staff_cat2') {
        const cat = interaction.values[0];
        const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
        return interaction.update({ components: [buildStaffCatPage(cat, cfg)], flags: MessageFlags.IsComponentsV2 });
      }

      
      if (id.startsWith('setup_staff_role_')) {
        const suffix = id.replace('setup_staff_role_', '');
        const parts  = suffix.split('__');
        const alan   = parts[0];
        const kademe = parts[1];
        if (alan === 'ceza_rolu' && kademe === 'single') {
          await StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { ceza_rolu: interaction.values[0] }, { upsert: true });
        } else {
          await StaffConfig.findOneAndUpdate({ guildId: message.guild.id }, { [`${alan}.${kademe}`]: interaction.values }, { upsert: true });
        }
        const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
        return interaction.update({ components: [buildStaffCatPage(alan, cfg)], flags: MessageFlags.IsComponentsV2 });
      }
    });
  },
};
