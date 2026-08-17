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
| B3 — blok blok görsel **doğrulama** (D-171'in döngüsü, ADIM 1'den devam) | `B3-blok-blok-gorsel-dogrulama.md` | ✅ BİTTİ 2026-08-16 — sekiz adımın hepsi onaylandı, D-165 v2/D-174/D-175/D-177/D-178/D-179 |
| C1 — status glifi, fishbone geometrisi, hipotez/aksiyon alanları | `C-yontem-plugin-insasi.md` (C'nin §3'ü) | ✅ BİTTİ 2026-08-16 — P-37 (4/5), P-34 kapandı, D-180 |
| C2 — `problem-impact` + 5N1K plugin'leri | `C2-problem-impact-5n1k.md` | ✅ BİTTİ 2026-08-16 — sıfır yeni mekanizma, D-181 |
| C3 — `kpi-strip` mekanizması + ADIM 7'nin gerçek plugin'i | `C3-kpi-strip.md` | ✅ BİTTİ 2026-08-17 — §2.2 Seçenek A (AskUserQuestion), P-31/P-36 kapandı, D-182 |
| C4-C6 — ADIM 8, whyWhyTree, tier/sürükle-tutamaç arayüzü | C4: *(yazılmadı, ama kendi dosyası olacak)* · C5-C6: *(yazılmadı)* | — C3'ün kendi kapanış kararı: **C4 kendi ayrı prompt dosyasını alacak** (C2/C3'le aynı gerekçe — ADIM 8'in dört adayı kendi alan listesi/substrat kararlarını taşıyor). C5-C6 için henüz karar verilmedi, ihtiyaç anında değerlendirilir |
| D — P-26 (i18n + blok hizası) | *(yazılmadı)* | — |

## Kullanım

Yeni oturumu şu iki satırla başlat (dosya adını sıradaki oturuma göre değiştir):

```
Önce Anayasamızı Oku (~/.claude/ANAYASA.md) ve AKIS.md'yi (~/.claude/AKIS.md).
Sonra ~/Developer/pps-hachi/docs/oturumlar/C3-kpi-strip.md'yi oku ve uygula.
```

## Prompt yazarken

- **Her dosya adını depoda doğrula.** Promptun ilk adımı, adlandırdığı dosyaların
  varlığını kontrol ettirmek olmalı — eskimiş bir prompt sessizce başarısız olur.
- **Kapsam dışını say.** Hangi LOCKED kararlara dokunulmayacağı yazılmazsa açılır.
- **Açık soruları başa al.** Cevap gelmeden yazılan tasarım yeniden yapılır.
- **Bütçeyi tahmin ettir ve bölmeyi yetkilendir** (Madde 1 / G1).
