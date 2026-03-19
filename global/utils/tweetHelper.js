const { AttachmentBuilder, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { drawTweet } = require('./tweetCanvas');
const { sendCanvasLog } = require('./logCanvas');

async function sendTweetMessage(channel, tweet) {
  const canvas = await drawTweet(tweet);
  const url = await sendCanvasLog(channel.guild, canvas);
  const attachment = url ? null : new AttachmentBuilder(canvas.toBuffer(), { name: 'tweet.png' });
  const imgUrl = url || 'attachment:

  const container = new ContainerBuilder();
  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imgUrl))
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `**${tweet.authorUsername}**\n${tweet.content}`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> Begeni: \`${tweet.likes.length}\`  ·  Repost: \`${tweet.reposts.length}\`  ·  Yorum: \`${tweet.comments.length}\``
    )
  );

  const begenBtn = new ButtonBuilder()
    .setCustomId(`tweet_begen_${tweet.tweetId}`)
    .setLabel(`Begen  ${tweet.likes.length}`)
    .setStyle(ButtonStyle.Secondary);

  const repostBtn = new ButtonBuilder()
    .setCustomId(`tweet_repost_${tweet.tweetId}`)
    .setLabel(`Repost  ${tweet.reposts.length}`)
    .setStyle(ButtonStyle.Secondary);

  const yorumBtn = new ButtonBuilder()
    .setCustomId(`tweet_yorum_${tweet.tweetId}`)
    .setLabel(`Yorum  ${tweet.comments.length}`)
    .setStyle(ButtonStyle.Secondary);

  const yorumlariGorBtn = new ButtonBuilder()
    .setCustomId(`tweet_yorumlar_${tweet.tweetId}`)
    .setLabel('Yorumlar')
    .setStyle(ButtonStyle.Primary);

  const silBtn = new ButtonBuilder()
    .setCustomId(`tweet_sil_${tweet.tweetId}`)
    .setLabel('Sil')
    .setStyle(ButtonStyle.Danger);

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(begenBtn, repostBtn, yorumBtn, yorumlariGorBtn, silBtn)
  );

  return channel.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    files: attachment ? [attachment] : [],
  });
}

async function updateTweetMessage(interaction, tweet) {
  const canvas = await drawTweet(tweet);
  const guild = interaction.guild ?? interaction.message?.guild;
  const url = await sendCanvasLog(guild, canvas);
  const attachment = url ? null : new AttachmentBuilder(canvas.toBuffer(), { name: 'tweet.png' });
  const imgUrl = url || 'attachment:

  const container = new ContainerBuilder();
  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imgUrl))
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `**${tweet.authorUsername}**\n${tweet.content}`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> Begeni: \`${tweet.likes.length}\`  ·  Repost: \`${tweet.reposts.length}\`  ·  Yorum: \`${tweet.comments.length}\``
    )
  );

  const begenBtn = new ButtonBuilder()
    .setCustomId(`tweet_begen_${tweet.tweetId}`)
    .setLabel(`Begen  ${tweet.likes.length}`)
    .setStyle(tweet.likes.includes(interaction.user.id) ? ButtonStyle.Primary : ButtonStyle.Secondary);

  const repostBtn = new ButtonBuilder()
    .setCustomId(`tweet_repost_${tweet.tweetId}`)
    .setLabel(`Repost  ${tweet.reposts.length}`)
    .setStyle(tweet.reposts.includes(interaction.user.id) ? ButtonStyle.Success : ButtonStyle.Secondary);

  const yorumBtn = new ButtonBuilder()
    .setCustomId(`tweet_yorum_${tweet.tweetId}`)
    .setLabel(`Yorum  ${tweet.comments.length}`)
    .setStyle(ButtonStyle.Secondary);

  const yorumlariGorBtn = new ButtonBuilder()
    .setCustomId(`tweet_yorumlar_${tweet.tweetId}`)
    .setLabel('Yorumlar')
    .setStyle(ButtonStyle.Primary);

  const silBtn = new ButtonBuilder()
    .setCustomId(`tweet_sil_${tweet.tweetId}`)
    .setLabel('Sil')
    .setStyle(ButtonStyle.Danger);

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(begenBtn, repostBtn, yorumBtn, yorumlariGorBtn, silBtn)
  );

  return interaction.update({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    files: attachment ? [attachment] : [],
  });
}

module.exports = { sendTweetMessage, updateTweetMessage };
