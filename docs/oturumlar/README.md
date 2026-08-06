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
| B1 — altı çalışma sayfası + `Lists & Settings` | `B-adim-anatomisi.md` (B'nin §5.1'i) | ✅ BİTTİ 2026-08-06 — P-30 kapandı, §13 |
| B2 — blok görsel dili + arayüz + esnek tahsis (kararlar) | `B2-gorsel-dil-arayuz.md` | ✅ BİTTİ 2026-08-06 — §14, D-165…D-172 |
| B3 — blok blok görsel **doğrulama** (D-171'in döngüsü, ADIM 1'den devam) | `B3-blok-blok-gorsel-dogrulama.md` | ⏳ sırada — ADIM 1 onay bekliyor, ADIM 2–8 kaldı |
| C — yöntem plugin'i budama + ekleme | *(yazılmadı)* | — B3 bitmeden yazılmaz |
| D — P-26 (i18n + blok hizası) | *(yazılmadı)* | — |

## Kullanım

Yeni oturumu şu iki satırla başlat (dosya adını sıradaki oturuma göre değiştir):

```
Önce Anayasamızı Oku (~/.claude/ANAYASA.md) ve AKIS.md'yi (~/.claude/AKIS.md).
Sonra ~/Developer/pps-hachi/docs/oturumlar/B3-blok-blok-gorsel-dogrulama.md'yi oku ve uygula.
```

## Prompt yazarken

- **Her dosya adını depoda doğrula.** Promptun ilk adımı, adlandırdığı dosyaların
  varlığını kontrol ettirmek olmalı — eskimiş bir prompt sessizce başarısız olur.
- **Kapsam dışını say.** Hangi LOCKED kararlara dokunulmayacağı yazılmazsa açılır.
- **Açık soruları başa al.** Cevap gelmeden yazılan tasarım yeniden yapılır.
- **Bütçeyi tahmin ettir ve bölmeyi yetkilendir** (Madde 1 / G1).
