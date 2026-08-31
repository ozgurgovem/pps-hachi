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

## Faz 7 — `SPEC.md` §6'nın kendi sıradaki fazı

`SPEC.md`'nin faz tablosu: "Coaching content, readiness rules, traceability view,
step-7→4 loop, appendix overflow." Faz 6 (6a–6e) tamamen kapandığı için sırada bu var.
Dört alt-teslimat birbirinden çok farklı olgunlukta (step-7→4 döngüsü ve appendix
overflow zaten var; readiness/traceability hiç yok) — Oturum A'nın kendi emsaliyle
önce bir **kapsam belirleme** oturumu (kod yok), sonra dilimlere bölünmüş inşa
oturumları.

**Kapsam belirleme BİTTİ 2026-08-19 (D-195).** Sekiz gate kuralının (S1-S8) her biri
gerçek koda karşı doğrulandı — S1 (gap sayısallaştırma) hiçbir Step 1 metodunda
yapılandırılmış alan olmadığı için tamamen boş çıktı (kendi açık sorusunu doğurdu,
aşağıya bkz.); S4 (kök neden verified) beklenenden zengin çıktı, `hypothesisVerification`
VE `whyWhyTree`'nin `outcome` alanı iki bağımsız mevcut sinyal; S2/S3/S6/S8 mekanik
kontrol edilebilir bulundu; S5/S7 kısmen var. Üç gerçek açık soru `AskUserQuestion` ile
Barış'a soruldu, üçü de cevaplandı (D-195): S4 kaynağı = hypothesisVerification VEYA
whyWhyTree; traceability yeri = RightPanel'in 3. sekmesi; provisional işaret = A3
bloğunun kenarında yeni görsel işaret (kendi Block Visual Verification Loop turunu
gerektiriyor). Step-7→4 döngüsü (D-192) ve appendix overflow (D-100) zaten var,
doğrulandı — ayrı dilim gerekmiyor.

| Dilim | Kapsam | Durum |
|---|---|---|
| Kapsam belirleme — sekiz gate kuralının veri durumu + dilim planı önerisi | — | ✅ BİTTİ 2026-08-19 — D-195, üç `AskUserQuestion` cevaplandı |
| G1 — readiness seçicisi + sekiz gate kuralı + StepStepper complete/flagged + amber advisory | `src/domain/readiness/` (yeni), `stepStatus.ts`, `StepPage.tsx`'in `ReadinessAdvisory`'si, `gapStatement`'ın S1 alanları. | ✅ BİTTİ 2026-08-20 — D-196, iki `AskUserQuestion` cevaplandı (S1 = Seçenek A/yalnızca gapStatement, complete = entry var + uyarı yok). P-46 yeni dosyalandı (S4'ün kişi-suçlama yarısı yok). |
| G2 — Traceability görünümü (RightPanel'in 3. sekmesi) | Zaten var olan `findOrphanedReferences`/`findReferencesTo`/`listReferenceableEntries`'i (D-117) + G1'in ürettiği readiness verisini okuyan yeni bir sekme | ✅ BİTTİ 2026-08-21 — D-197, üç `AskUserQuestion` cevaplandı (görünüm = metin/liste zinciri, Step 7/8 boşluğu = sabit not, düğüm tıklama = zıplar). Tek yeni mekanizma: `src/app/routes/workspace/traceability.ts`'in jenerik `buildTraceabilityChains`'i. |
| G3 — "Provisional" A3 kenar işareti (D-165/D-41'in üçüncü görsel katmanı) | `buildA3Layout.ts` + `HtmlA3Renderer.tsx` + `src-tauri/src/xlsx/writer.rs`. Kendi Block Visual Verification Loop turunu gerektirdi — en pahalı dilim. | ✅ BİTTİ 2026-08-23 — D-198, üç `AskUserQuestion` cevaplandı (kapsam = önizleme+export, appendix = yalnızca ana sayfa, round-farkındalığı = hayır). Görsel: Aday A (kesikli grafit çerçeve, `#20241F`), tek turda değişikliksiz onaylandı. |

**Faz 7 (G1/G2/G3) artık tamamen BİTTİ** — `SPEC.md`'nin kendi Faz 7 satırı tam olarak
karşılandı.

## Faz 8 — `SPEC.md` §6'nın kendi sıradaki fazı: AI foundation

`SPEC.md`'nin faz tablosu: "provider abstraction, keychain storage, Settings tab,
connection test, model discovery, streaming chat panel, provenance plumbing." Yedi
alt-teslimat tek cümlede sıralanmış ama olgunluk açısından çok farklı — Oturum A/Faz 7
kapsam-belirleme emsaliyle önce ölçüm, sonra dilim.

**Kapsam belirleme BİTTİ 2026-08-30 (D-199).** 2026-08-23'ün kendi ön taraması gerçek koda
karşı yeniden doğrulandı, birebir eşleşti (Settings rotası yok, `src/ai/` boş, Rust'ta
keyring/HTTP client yok, Playwright yok, Assistant sekmesi `{null}`). **Oturumun asıl
bulgusu D-13'ü kısmen geçersiz kıldı**: `SPEC.md` §8.2'nin üç-sağlayıcı (Anthropic/OpenAI/
Google) varsayımı bu dağıtımda geçerli değil — Farplas yalnızca kendi kurumsal AI
gateway'ini, **Vorion**'u (`vorionai.com`) kullanabiliyor. Vorion'un kendi chatbot'u kendi
dokümantasyonu hakkında iki kez kanıtlanmış yanlış/uydurma cevap verdi (Anayasa Madde 8'in
canlı bir uygulaması) — gerçek API Reference ancak Barış'ın yetkili tarayıcı oturumunda
doğrudan bulundu: base URL `https://vorionai.com/api/<service>`, `x-api-key` header'ı,
LLM Service'in Predictions (Synchronous/Streaming SSE/Cancel) + LLM Configuration (List
LLMs/Get Available LLMs Grouped) alt kümeleri `LlmProvider` trait'inin (§8.2) ihtiyaçlarına
birebir uyuyor. **Bilinçli sınır kararı**: PPS Hachi yalnızca bu alt kümeye dokunacak,
Vorion'un Agent/RAG/Marketplace yüzeyine hiç girmeyecek (D-15/D-16'nın LOCKED sınırını
Vorion'un tarafında delme riskinden kaçınmak için). Dört gerçek açık soru düz metinle
(`AskUserQuestion` bu oturumda reddedildi) Barış'a soruldu, hepsi cevaplandı — tam kayıt:
D-199.

| Dilim | Kapsam | Durum |
|---|---|---|
| Kapsam belirleme — yedi alt-teslimatın veri durumu + tek-sağlayıcı (Vorion) keşfi + dilim planı | — | ✅ BİTTİ 2026-08-30 — D-199, dört soru düz metinle cevaplandı |
| Dilim 1 — Settings shell (minimal) + Rust `LlmProvider` trait + `keyring` + model-keşif + test connection | `docs/oturumlar/faz8-dilim1-vorion-temel.md` | ✅ BİTTİ 2026-08-30 — D-200, iki `AskUserQuestion` cevaplandı, Barış'ın kendi yetkili taramasından beş ekran görüntüsü turuyla gerçek API şekli doğrulandı (tahmin yok). `npm test` 1179/1179, `cargo test` 123/123, ikisi de exit 0; `cargo clippy`/`cargo fmt` temiz. Dürüstçe owed: gerçek bir Tauri penceresinde/gerçek anahtarla uçtan uca deneme bu ortamdan yapılamadı. |
| Dilim 2 — Streaming completion uçtan uca (SSE→Tauri Channel) + `RightPanel`'in Assistant sekmesinde çıplak chat kutusu + provenance plumbing | `docs/oturumlar/faz8-dilim2-vorion-streaming.md` | ✅ BİTTİ 2026-08-31 — D-201, Barış'ın altı ekran görüntüsüyle Streaming/Cancel Prediction'ın gerçek şekli doğrulandı (tahmin yok). Kodlarken iki gerçek hata kendi kendine yakalandı: bir Türkçe-karakter UTF-8 bölünme riski (tasarım incelemesiyle) ve bir wire-shape/TS-shape karışıklığı (`cargo test` kırmızı verdi). `npm test` 1206/1206, `cargo test` 136/136, ikisi de exit 0; `cargo clippy`/`cargo fmt` temiz. Debug amaçlı geçici bir "Enable AI for this project" anahtarı `SettingsScreen`'e eklendi (§8.5'in gerçek New Project AI adımı gelene kadar). Owed: gerçek Tauri penceresinde uçtan uca deneme (aynı D-105/D-113/D-136/D-200 sınıfı gap). P-47 (`editDistance` hesaplanmadı), P-48 (Resume Stream uygulanmadı) açık. |
| Dilim 3 — D-20'nin "AI kapalı" mutlu-yol testi + gerçek E2E araç seçimi (SPEC'in "Playwright" sözcüğü kodlamadan önce Tauri v2'nin güncel E2E ekosistemine karşı doğrulanmalı) | `docs/oturumlar/faz8-dilim3-playwright-ai-kapali.md` | ✅ BİTTİ 2026-08-31 — D-202. Araştırma sonucu **WebdriverIO** seçildi (Playwright'ın resmi Tauri desteği yok); karar Barış tarafından bilinçli olarak devredildi. İki gerçek Cargo/tauri-build tuzağı yalnızca `cargo check --release` ile ampirik olarak bulundu ve düzeltildi (`[target.'cfg(debug_assertions)']` profile göre değişmiyor → açık `e2e-test` Cargo feature'ına geçildi; `tauri-build` capabilities allowlist'i build-time validation'da hiç uygulamıyor → `e2e-test.json` `capabilities-e2e/`'e taşındı, `build.rs` kendi kendini onaran bir kopyala/sil mekanizmasıyla feature'a göre `capabilities/`'i uzlaştırıyor). Gerçek uçtan uca `npm run test:e2e:build` çalıştırılıp `src-tauri/target/debug/pps-hachi` gerçekten üretildi. `npm test` 1206/1206, `cargo test` 136/136 (değişmedi, bu dilim yeni Rust testi eklemedi), ikisi de exit 0; `cargo clippy`/`cargo fmt`/`tsc --noEmit` temiz; üretim `dist/`'inde `wdio` sıfır kez geçiyor (grep ile doğrulandı). CI'a her iki platforma da iki yeni adım eklendi. **Dürüstçe owed**: bu ortamda ekran yok, `e2e/specs/*.spec.ts`'in kendisi (yalnızca build'i değil, gerçek wdio testrunner'ını) hiç çalıştırılmadı; `browser.tauri.mock()`'ün bu app'in gerçek UI'ında tetiklenen `invoke()` çağrılarını gerçekten yakalayıp yakalamadığı da doğrulanmadı (P-49) — test bu varsayım yanlışsa sessizce değil gürültülü şekilde başarısız olacak biçimde tasarlandı. **D-149'un dört-oturumluk arayüz planından bağımsız, Faz 8'in kendi üç dilimi artık tamamen bitti.** |

## Faz 9 — `SPEC.md` §6'nın kendi sıradaki fazı: AI structured generation

`SPEC.md`'nin faz tablosu: "`generateStructured` per provider, per-step prompt library,
proposal→accept/edit/reject flow, file & image ingestion, redaction layer — Done when: the
assistant can propose a valid Pareto entry from an uploaded xlsx." Faz 8'in kendi kapsam
belirleme emsaliyle aynı: ölçüm önce, sonra dilim. `SPEC.md` §8'in metni hâlâ Gün-1'in
üç-sağlayıcı varsayımıyla yazılmış — D-199/D-200/D-201'in zaten doğruladığı tek-sağlayıcı
(Vorion) gerçeğinden okunmalı. Bu fazın kendi kalbi, D-199'un bilerek çözülmemiş bıraktığı
soru: Vorion'un yapılandırılmış-çıktı (structured output) şekli ayrı bir endpoint mi, yoksa
Prediction isteğinde bir parametre mi — hiç görülmedi, kodlamadan önce doğrulanmalı.

| Dilim | Kapsam | Durum |
|---|---|---|
| Kapsam belirleme — beş alt-teslimatın veri durumu + Vorion'un yapılandırılmış-çıktı sorusu + dilim planı | `docs/oturumlar/faz9-kapsam-belirleme.md` | 📝 launch prompt yazıldı 2026-08-31, henüz başlanmadı. |

## Kullanım

Yeni oturumu şu iki satırla başlat (dosya adını sıradaki oturuma göre değiştir):

```
Önce Anayasamızı Oku (~/.claude/ANAYASA.md).
Sonra ~/Developer/pps-hachi/docs/oturumlar/faz8-dilim1-vorion-temel.md'yi oku ve uygula.
```

## Prompt yazarken

- **Her dosya adını depoda doğrula.** Promptun ilk adımı, adlandırdığı dosyaların
  varlığını kontrol ettirmek olmalı — eskimiş bir prompt sessizce başarısız olur.
- **Kapsam dışını say.** Hangi LOCKED kararlara dokunulmayacağı yazılmazsa açılır.
- **Açık soruları başa al.** Cevap gelmeden yazılan tasarım yeniden yapılır.
- **Bütçeyi tahmin ettir ve bölmeyi yetkilendir** (Madde 1 / G1).
