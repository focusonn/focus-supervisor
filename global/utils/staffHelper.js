const StaffConfig = require('../models/StaffConfig');

async function getConfig(guildId) {
  return StaffConfig.findOne({ guildId });
}

async function hasRole(member, guildId, cats, minKademe = 'sorumluluk') {
  const cfg = await getConfig(guildId);
  if (!cfg) return false;

  const memberRoles = member.roles.cache;
  const kademeler = ['sorumluluk', 'denetim', 'lider'];
  const minIdx = kademeler.indexOf(minKademe);

  for (const cat of (Array.isArray(cats) ? cats : [cats])) {
    const alan = cfg[cat];
    if (!alan) continue;
    for (let i = minIdx; i < kademeler.length; i++) {
      const ids = alan[kademeler[i]] || [];
      if (ids.some(id => memberRoles.has(id))) return true;
    }
  }

  return false;
}

async function hasExactKademe(member, guildId, cat, kademe) {
  const cfg = await getConfig(guildId);
  if (!cfg) return false;
  const alan = cfg[cat];
  if (!alan) return false;
  const ids = alan[kademe] || [];
  return ids.some(id => member.roles.cache.has(id));
}

module.exports = { getConfig, hasRole, hasExactKademe };
