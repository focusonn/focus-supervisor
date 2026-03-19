# FocusBot

Discord sunucu yönetim botu.

**Yapımcı:** focus

---

## Kurulum

```bash
npm install
node foxuspub.js
```

`global/settings/settings.json` dosyasını düzenle:

```json
{
  "token": "BOT_TOKEN",
  "prefix": ".",
  "mongoURI": "mongodb://localhost:27017/db",
  "ownerID": "OWNER_ID",
  "guildID": "GUILD_ID"
}
```

---

## Komutlar

### BotOwner
| Komut | Açıklama |
|---|---|
| .setup | Sunucu ayarlarını yapar |
| .ozeloda-kur | Özel oda sistemini kurar |
| .rolmenu | Rol menüsü paneli |
| .ceza-panel | Ceza paneli kurar |
| .kullanici-panel | Kullanıcı paneli kurar |
| .yetkili-basvuru | Yetkili başvuru paneli |
| .streamer-basvuru | Streamer başvuru paneli |
| .sorumluluk-basvuru | Sorumluluk başvuru paneli |
| .sorun-panel | Sorun çözme paneli |
| .itiraf-panel | İtiraf paneli |
| .ozel-komut | Özel komut ekler |

### Ceza
| Komut | Açıklama |
|---|---|
| .ban | Kullanıcıyı banlar |
| .unban | Banı kaldırır |
| .mute | Kullanıcıyı susturur |
| .unmute | Susturmayı kaldırır |
| .voicemute | Ses susturma |
| .unvoicemute | Ses susturmayı kaldırır |
| .jail | Kullanıcıyı hapseder |
| .unjail | Hapsi kaldırır |
| .warn | Uyarı verir |
| .unwarn | Uyarıyı kaldırır |
| .warns | Uyarıları listeler |
| .cezapuan | Ceza puanını gösterir |
| .cezapuansifirla | Ceza puanını sıfırlar |

### Kayıt
| Komut | Açıklama |
|---|---|
| .kayit | Kullanıcıyı kaydeder |
| .kayitsiz | Kayıtsız yapar |
| .isim | İsim değiştirir |
| .kiz | Kız olarak kaydeder |

### İstatistik
| Komut | Açıklama |
|---|---|
| .stat | Kullanıcı istatistiklerini gösterir |
| .leaderboard / .lb | Sunucu sıralamaları (1dk'da bir güncellenir) |
| .say | Sunucu istatistiklerini gösterir |
| .invite | Davet istatistikleri |
| .top | Canvas top listesi |

### Ekonomi
| Komut | Açıklama |
|---|---|
| .daily | Günlük ödül alır |
| .hesap | Bakiyeyi gösterir |
| .cf | Yazı tura oynar |
| .slot | Slot makinesi oynar |

### Genel
| Komut | Açıklama |
|---|---|
| .help | Yardım menüsü |
| .afk | AFK modunu açar/kapatır |
| .ship | İki kullanıcının uyumunu ölçer |
| .spotify | Spotify aktivitesini gösterir |
| .url | Sunucu vanity URL'sini gösterir |

---

## Gereksinimler

- Node.js v18+
- MongoDB
- discord.js v14
