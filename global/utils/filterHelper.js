const KUFURLER = [
  'orospu', 'orospucocugu', 'sik', 'siki', 'sikim', 'sikeyim', 'sikik', 'sikis',
  'amk', 'amina', 'aminakoyim', 'aminakoyayim', 'bok', 'boktan', 'oç', 'oc',
  'piç', 'pic', 'piçlik', 'piclik', 'göt', 'got', 'götlek', 'gotlek',
  'ibne', 'orospu', 'kahpe', 'kaltak', 'serefsiz', 'şerefsiz',
  'bok', 'bokum', 'yarrak', 'yarak', 'yarrağa', 'yarraga',
  'pezevenk', 'gavat', 'oğlancı', 'oglanci', 'puşt', 'pust',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  'nigga', 'nigger', 'faggot',
];

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşüâîû]/gi, '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a');
}

function containsProfanity(text) {
  const norm = normalize(text);
  return KUFURLER.some(k => norm.includes(normalize(k)));
}

module.exports = { containsProfanity };
