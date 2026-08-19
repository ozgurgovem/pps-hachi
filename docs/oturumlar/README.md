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
| C4 — ADIM 8 tasarım turu + inşası (+ Sustainment Audits, ADIM 7) | `C4-adim8.md` | ✅ BİTTİ 2026-08-17 — §2.2'nin üç sorusu `AskUserQuestion` ile onaylandı, sıfır yeni mekanizma, D-183 |
| C5 — whyWhyTree diyagramı + terminal-durum alanı + referans mimarisi | `C5-whywhytree-diyagram.md` | ✅ BİTTİ 2026-08-17 — diyagram + terminal-durum alanı (D-184), §2.3 Seçenek A kararlaştırıldı ama inşası P-39'a ertelendi (D-185), P-35 2/3 kapandı |
| C6 — `MethodPlugin.tier` + iki-bölümlü `MethodBand` (daraltıldı, D-186 — sürükle-tutamaç Faz 11'e ertelendi, P-40) | `C6-tier-methodband.md` | ✅ BİTTİ 2026-08-18 — §2.4 `AskUserQuestion` Seçenek B (whyWhyTree Adım 4'e üçüncü önerilen eklendi), D-187. **D-149'un Oturum C bacağı tamamen kapandı.** |
| D — kapsam belgesi (P-26'nın iki kusur sınıfı, dilim önerisi) | `D-i18n-blok-hizasi.md` | 📝 yazıldı 2026-08-18 — üst seviye kapsam, kod içermiyor |
| D1 — A3 ihracat etiketlerinin dil farkındalığı | `D1-i18n-ihracat-etiketleri.md` | ✅ BİTTİ 2026-08-18 — Seçenek B (`AskUserQuestion`), gerçek kapsam 29 dizin (tahminin ~2 katı), D-188, P-26'nın i18n yarısı kapandı, P-42 (Fishbone) yeni dosyalandı |
| D2 — blok hizası kök neden keşfi | `D2-blok-hizasi.md` | ✅ BİTTİ 2026-08-18 (keşif) — kök neden bulundu: `placeZones.ts`'te iki kusur (D-189), düzeltme D2b'ye bırakıldı (P-43). **D-149'un dört oturumluk planı tamamen kapandı.** |
| D2b — blok hizası düzeltmesi (D2'nin bulduğu kök nedenin düzeltilmesi, P-43) | `D2b-blok-hizasi-duzeltme.md` | ⏳ kod+test BİTTİ 2026-08-18 (D-190) — Barış'ın görsel onayı bekleniyor, bkz. `TEMPLATE_ANALYSIS.md` §15.8. Aynı oturumda, plan dışı: `countermeasure`'ın Uygulama Planı önceliklendirme tablosu (D-191). |

## Faz 6'nın kendi dilimleri (D-114) — D-149'un arayüz/yapı planından AYRI bir girişim

Yukarıdaki tablo D-149'un dört oturumluk arayüz/yapı planı (A, B1–B3, C1–C6, D1–D2b) —
o plan tamamen kapandı. `SPEC.md`'nin kendi Faz 6 planı (D-114) beş dilime bölündü
(6a–6e); 6a/6b/6c bu dosya kuralından önce (2026-08-03/04/05) sohbette yürütüldüğü için
buraya yazılmadı. 6e kendi içinde 6e-1/6e-2'ye bölündü (D-193) — ikisi de bitti. **D-114'ün
beş dilimi (6a–6e) ve `SPEC.md`'nin kendi Faz 6 planı artık tamamen kapandı.**

| Dilim | Dosya | Durum |
|---|---|---|
| 6d — Adım 7/8'in kalan yöntemleri + rounds/signOff bağlamaları | `6d-rounds-signoff-adim7-8.md` | ✅ BİTTİ 2026-08-18 — `AskUserQuestion` üç önerilen seçenek de onaylandı, D-192, P-37 (resultVerdict/openItemsNextProblem glif) tamamlandı |
| 6e-1 — görüntü içe alma mekanizması + açıklama gerektirmeyen 2 yöntem (`gemba-observation-log`, `before-after-photos`) | `6e-goruntu-iceriye-alma.md` | ✅ BİTTİ 2026-08-19 — `AskUserQuestion` iki önerilen seçenek de onaylandı (bölünme + sayısal tavanlar), D-193, P-44 (HEIC yok) yeni dosyalandı |
| 6e-2 — çizim/açıklama mekanizması + 3 yöntem (`defect-photo-board`, `spaghetti-diagram`, `value-stream-map`) | `6e-2-goruntu-aciklama.md` | ✅ BİTTİ 2026-08-19 — `AskUserQuestion` üç önerilen seçenek de onaylandı, D-194, P-45 kapandı. Gerçek Tauri webview'da görsel doğrulanmadı (bkz. D-194'ün kendi dürüstlük notu). |

## Kullanım

Yeni oturumu şu iki satırla başlat (dosya adını sıradaki oturuma göre değiştir):

```
Önce Anayasamızı Oku (~/.claude/ANAYASA.md) ve AKIS.md'yi (~/.claude/AKIS.md).
Sonra ~/Developer/pps-hachi/docs/oturumlar/6e-2-goruntu-aciklama.md'yi oku ve uygula.
```

## Prompt yazarken

- **Her dosya adını depoda doğrula.** Promptun ilk adımı, adlandırdığı dosyaların
  varlığını kontrol ettirmek olmalı — eskimiş bir prompt sessizce başarısız olur.
- **Kapsam dışını say.** Hangi LOCKED kararlara dokunulmayacağı yazılmazsa açılır.
- **Açık soruları başa al.** Cevap gelmeden yazılan tasarım yeniden yapılır.
- **Bütçeyi tahmin ettir ve bölmeyi yetkilendir** (Madde 1 / G1).
