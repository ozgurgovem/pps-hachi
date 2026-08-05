# Oturum promptları

D-149 arayüz/yapı işini dört oturuma böldü. Her oturumun açılış promptu burada
yaşar — sohbette değil. Sebep somut: 2026-08-05'te Oturum B'nin promptu yazıldıktan
**20 dakika sonra** eskidi (bir referans dosyasının adı değişti, bir P kaydı kapandı,
bir uyarı eklendi). Sohbetteki kopya deponun gerçeğinden sessizce ayrışır — ajan
olmayan dosyayı arar, bulamaz, geçer ve kimse fark etmez. Depoda duran prompt
diffle görünür ve denetlenebilir.

| Oturum | Dosya | Durum |
|---|---|---|
| A — sayfa sözleşmesi | *(prompt sohbetteydi)* | ✅ BİTTİ 2026-08-05 — `reference/TEMPLATE_ANALYSIS.md` §12, D-154…D-160 |
| B — adım anatomisi + blok görsel dili | `B-adim-anatomisi.md` | ⏳ sırada |
| C — yöntem plugin'i budama | *(yazılmadı)* | — B bitmeden yazılmaz |
| D — P-26 (i18n + blok hizası) | *(yazılmadı)* | — |

## Kullanım

Yeni oturumu şu iki satırla başlat:

```
Önce Anayasamızı Oku (~/.claude/ANAYASA.md) ve AKIS.md'yi (~/.claude/AKIS.md).
Sonra ~/Developer/pps-hachi/docs/oturumlar/B-adim-anatomisi.md'yi oku ve uygula.
```

## Prompt yazarken

- **Her dosya adını depoda doğrula.** Promptun ilk adımı, adlandırdığı dosyaların
  varlığını kontrol ettirmek olmalı — eskimiş bir prompt sessizce başarısız olur.
- **Kapsam dışını say.** Hangi LOCKED kararlara dokunulmayacağı yazılmazsa açılır.
- **Açık soruları başa al.** Cevap gelmeden yazılan tasarım yeniden yapılır.
- **Bütçeyi tahmin ettir ve bölmeyi yetkilendir** (Madde 1 / G1).
