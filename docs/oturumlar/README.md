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

**Kapsam belirleme BİTTİ 2026-08-31 (D-203).** §0'ın kendi ön taraması gerçek koda karşı
yeniden doğrulandı, birebir eşleşti. Kendi taramam iki yük taşıyan bulgu ekledi: her method
plugin'i zaten gerçek bir Zod şeması taşıyor (`MethodPlugin.schema`) — yapılandırılmış
üretimin ilk günden gerçek bir hedefi var; `calamine` `Cargo.toml`'da var ama yalnızca test
fixture kodunda kullanılıyor — dosya içeri alma gerçekten yeni bir üretim alt sistemi. Dört
gerçek açık soru `AskUserQuestion` ile Barış'a soruldu, dördü de önerilen seçenekle
onaylandı: prompt kütüphanesi `src/ai/prompts/{step}/{methodId}.{version}.md`'de yaşar
(coaching content'in dosya-değil-JSX emsali); dosya içeri alma kendi dilimi (J2), önce
elle-veriyle uçtan uca kanıtlanmış bir akıştan (J1) sonra; redaction temel bir gerçek
hâliyle J2 ile birlikte gelir, ertelenmez (§8.1'in LOCKED "kullanıcının verisi
kullanıcınındır" ilkesi J2'de teorik olmaktan çıkar); proposal UI'ı yeni bir generic-shell
alanı (`EntryProposalField`, D-125'in üçüncü uygulaması), AssistantPanel'in mevcut sohbetine
katlanmaz. Tam kayıt: D-203.

| Dilim | Kapsam | Durum |
|---|---|---|
| Kapsam belirleme — beş alt-teslimatın veri durumu + Vorion'un yapılandırılmış-çıktı sorusu + dilim planı | `docs/oturumlar/faz9-kapsam-belirleme.md` | ✅ BİTTİ 2026-08-31 — D-203, dört soru `AskUserQuestion` ile cevaplandı (hepsi önerilen seçenek). |
| J1 — Vorion'un yapılandırılmış-çıktı şeklinin doğrulanması (Barış'ın kendi `vorionai.com/docs` oturumu, kodlamadan ÖNCE) + `LlmProvider.complete_structured`/`capabilities()` + prompt-kütüphanesi mekanizması + TEK referans method (Pareto) elle-girilen veriyle uçtan uca `EntryProposalField` üzerinden | `docs/oturumlar/J1-pareto-yapilandirilmis-oneri.md` | ✅ BİTTİ 2026-08-31 — D-204. §2.1 Barış'ın sekiz ekran görüntüsüyle **(b)**'ye kesin karar verdi: Vorion'da yapılandırılmış-çıktıya özel bir alan yok, `complete_structured` Synchronous Prediction üzerine kurulu bir istem-mühendisliği katmanı. **P-47 KAPANDI** — `normalizedEditDistance` (JSON-stringify üzerinden Levenshtein) Accept anında hesaplanıyor. `npm test` 1243/1243 (1206'dan yukarı), `cargo test` 145 lib + 2 + 8 = 155 (136'dan yukarı), ikisi de exit 0; `cargo clippy`/`cargo fmt`/`tsc --noEmit` temiz; `gen-a3-fixture.ts` diff'i byte-identical. Yeni P-50 (`contextSlices` front-matter alanı hâlâ tüketilmiyor, J2/J3'e owed). |
| J2 — Gerçek dosya içeri alma (Rust xlsx/csv okuma+örnekleme, `calamine` ilk kez üretimde; gönderim-öncesi onay sayfası) + temel gerçek `RedactionPolicySchema` (off/customers, terim listesi), J1'in akışına bağlanır | `docs/oturumlar/J2-dosya-iceri-alma-redaction.md` | ✅ BİTTİ 2026-09-01 — D-205. Kodlamadan önceki calamine-doğrulaması öngörülmeyen bir gerçek buldu: **calamine'in hiç CSV desteği yok** (docs.rs'ten doğrulandı) — SPEC §8.9'un metni yanlıştı; ayrı bir `csv` crate (BurntSushi, v1.4.0) eklendi. Dört `AskUserQuestion` kararı hepsi önerilenle onaylandı: CSV için ayrı crate, kategori-bazlı stratified örnekleme, redaction Rust'ta transmission anında (`VorionProvider::complete_structured`, elle-yazılan+dosyadan-gelen tek noktadan), tek oturumda bitir (J2a/J2b bölünmesi gerekmedi). Faz 9'un kendi lafzî done-koşulu kalıcı bir PROBE testiyle (`paretoFromXlsxAttachment.probe.test.ts`) kanıtlandı. `npm test` 1272/1272 (1243'ten yukarı), `cargo test` 170 lib + 2 + 8 = 180 (155'ten yukarı), ikisi de exit 0; `cargo clippy`/`cargo fmt` temiz; `gen-a3-fixture.ts` dokunulmadı (etkilenmiyor, grep ile doğrulandı). P-50 hâlâ AÇIK (`contextSlices` hâlâ tüketilmiyor). Yeni P-51 (redaction yalnızca `complete_structured`'a bağlı, `AssistantPanel`'in serbest sohbetine değil) ve P-52 (yalnızca ilk xlsx sayfası okunuyor). |
| J3 — Per-step prompt kütüphanesinin Pareto'dan registry'nin geri kalan 57 method'una genelleştirilmesi (yeni mekanizma yok — dilim başına bir adım) | `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md` | J3-1 (Adım 1, 9 method) ✅ BİTTİ 2026-09-01 — D-206, sıfır mimari karar, saf tekrar + prompt mühendisliği. `registry.test.ts`'e TEK jenerik değişmez eklendi (`describe("MethodPlugin.aiProposal across the registry")`), mutation-check'le doğrulandı. `npm test` 1274/1274 (1272'den yukarı), `cargo test` 180/180 (J2'den değişmedi, Rust'a hiç dokunulmadı), ikisi de exit 0; lint/build/clippy/fmt temiz; `gen-a3-fixture.ts` etkilenmiyor. J3-2 (Adım 2, 9 method) ✅ BİTTİ 2026-09-02 — D-207, yine sıfır mimari karar. `src/ai/prompts/2/` pareto'nun yanına 9 yeni dosya kazandı (`category-breakdown`/`check-sheet`/`distribution-chart`/`is-is-not`/`msa-gage-rr`/`point-of-cause`/`process-flow-sipoc`/`stratification-matrix`/`trend`). Mevcut jenerik değişmez yeni 9'u otomatik kapsadı, `arrayContaining` listesi genişletildi ve mutation-check'le doğrulandı; bir yan bulgu olarak `library.test.ts`'in "henüz yok" örneği (`trend`/`v1`) bu dilimin ürettiği gerçek dosyayla çakıştığı için düzeltildi. `npm test` 1274/1274, `cargo test` 180/180 (değişmedi, Rust'a hiç dokunulmadı), ikisi de exit 0; lint/build/clippy/fmt temiz; `gen-a3-fixture.ts` etkilenmiyor. **Plan sekiz dilimden yediye düştü**: J3-3 (Adım 3, tek method) J3-4 (Adım 4, 9 method) ile birleştirildi — J3-1'in kendi notu bunu öngörmüştü. J3-3 (Adım 3+4, 10 method) ✅ BİTTİ 2026-09-02 — D-208, yine sıfır mimari karar. `src/ai/prompts/3/smart-target.v1.md` + `src/ai/prompts/4/` (9 yeni dosya: `cause-effect-matrix`/`comparative-analysis`/`fault-tree`/`fishbone`/`five-why`/`hypothesis-verification`/`pfmea-linkage`/`three-legged-five-why`/`why-why-tree`). Bu dilimin kendi zorluğu üç düğüm/graf şemasıydı (`fishbone`'un id/categoryId/parentCauseId tutarlılığı, `why-why-tree`'nin dallanan `nodes[]`'ı, `hypothesis-verification`'ın `evidence` alanı) ve dört method'ta tekrarlanan "operatör hata yaptı" çıkmazı uyarısı (SPEC §8.6'nın kendi Adım 4 cümlesinden). `arrayContaining` listesine dört method eklendi, mutation-check'le doğrulandı. `npm test` 1274/1274 (değişmedi, 10 yeni dosya test dosyası değil), `cargo test` 121/121 (değişmedi, Rust'a hiç dokunulmadı), ikisi de exit 0; lint/build/clippy/fmt temiz; `gen-a3-fixture.ts` etkilenmiyor. J3-4 (Adım 5, 7 method) ✅ BİTTİ 2026-09-02 — D-209, yine sıfır mimari karar. `src/ai/prompts/5/` (7 yeni dosya: `cost-approval`/`countermeasure`/`error-proofing-hierarchy`/`impact-effort-matrix`/`side-effect-risk-assessment`/`trial-plan`/`weighted-decision-matrix`). Bu dilimin kendi dikkat noktası dört referans-taşıyan method'un (`hypothesis-verification` J3-3'te zaten yazılmıştı, `countermeasure`/`error-proofing-hierarchy`/`side-effect-risk-assessment` bu dilimde) prompt'unu referans alanına hiç değinmeden yazmaktı, artı `countermeasure`'ın ters-çevrilmiş 1-5 favorability skorlarını (`impactScore`/`costScore`/`durationScore`) `impact-effort-matrix`'in düz zorluk skorundan (`effort`) net ayırmak ve `priorityDecision`'ı SPEC'in "a human always decides" ilkesi gereği her zaman `"pending"`a sabitlemek. `arrayContaining` listesine üç method eklendi, mutation-check'le doğrulandı. `npm test` 1274/1274 (değişmedi, 7 yeni dosya test dosyası değil), `cargo test` 180/180 (değişmedi, Rust'a hiç dokunulmadı), ikisi de exit 0; lint/build/clippy/fmt temiz; `gen-a3-fixture.ts` etkilenmiyor. J3-5 (Adım 6, 5 method) ✅ BİTTİ 2026-09-05 — D-210, yine sıfır mimari karar. `src/ai/prompts/6/` (5 yeni dosya: `action-item`/`ica-pca-transition`/`implementation-issues-log`/`training-communication-record`/`trial-result-log`). Bu dilimin kendi dikkat noktası registry'nin TEK çift-rollü method'u `ica-pca-transition`'ın (`containment` + `countermeasure`) ve `action-item`'ın (`countermeasure`) prompt'unu referans alanına hiç değinmeden yazmaktı, artı `action-item`'ın `percentComplete` alanının sayı-VEYA-ifade serbest metin doğasını uydurma bir yüzdeye kaymadan doğru anlatmak. `arrayContaining` listesine üç method eklendi, test adı "J1/J3-1/J3-2/J3-3/J3-4/J3-5" olarak güncellendi, mutation-check'le doğrulandı. `npm test` 1274/1274 (değişmedi, 5 yeni dosya test dosyası değil), `cargo test` 180/180 (değişmedi, Rust'a hiç dokunulmadı), ikisi de exit 0; lint/build/clippy/fmt temiz; `gen-a3-fixture.ts` etkilenmiyor. J3-6 (Adım 7, 5 method) ✅ BİTTİ 2026-09-05 — D-211, yine sıfır mimari karar. `src/ai/prompts/7/` (5 yeni dosya: `kpi-strip`/`realized-cost-benefit`/`result-verdict`/`statistical-confirmation`/`sustainment-audit`). Bu dilimin kendi dikkat noktası tek chart-üreten method'u (`kpi-strip`) Pareto'nun sayısal-liste desenine uyarlamak, `status`'un hiçbir zaman baseline/target/actual'dan hesaplanmadığını açıkça yazmak, artı `result-verdict`'in SPEC §8.6'nın "dürüst bir verdict ver" ilkesini 4-değerli `pending`/`met`/`partiallyMet`/`notMet` alanında aşırı-iyimser bir tahmine kaymadan uygulamaktı. `arrayContaining` listesine üç method eklendi, test adı "J1/J3-1/J3-2/J3-3/J3-4/J3-5/J3-6" olarak güncellendi, mutation-check'le doğrulandı. `npm test` 1274/1274 (değişmedi, 5 yeni dosya test dosyası değil), `cargo test` 180/180 (değişmedi, Rust'a hiç dokunulmadı), ikisi de exit 0; lint/build/clippy/fmt temiz; `gen-a3-fixture.ts` etkilenmiyor (`kpi-strip` kendi `A3ImageKind`/renderer'ını zaten taşıyordu, bu dilim yalnızca `aiProposal` ekledi). J3-7 (Adım 8, 5 method) ✅ BİTTİ 2026-09-05 — D-212, yine sıfır mimari karar, **J3'ün yedi dilimlik planının SON dilimi**. `src/ai/prompts/8/` (yeni dizin, 5 dosya: `document-updates-tracker`/`lessons-learned`/`open-items-next-problem`/`sustain-plan`/`yokoten-tracker`). Bu dilimin kendi dikkat noktası `document-updates-tracker`'ın yedi sabit doküman tipini TAMAMEN bağımsız işlemekti — kaynak veri bir doküman tipinden hiç bahsetmiyorsa dokuz alanın tamamı boş string kalıyor (status/approval için "notStarted"/"draft" gibi bir varsayılana DÜŞÜLMÜYOR), çünkü bu D-183'ün "her alan boşsa alt-bölüm tamamen atlanır" ilkesinin dayandığı sinyal. `arrayContaining` listesine üç method eklendi, test adı "J1/J3-1/J3-2/J3-3/J3-4/J3-5/J3-6/J3-7" olarak güncellendi, mutation-check'le doğrulandı. `npm test` 1274/1274 (değişmedi, 5 yeni dosya test dosyası değil), `cargo test` 180/180 (değişmedi, gerçekten çalıştırılarak doğrulandı, Rust'a hiç dokunulmadı), ikisi de exit 0; lint/build/clippy/fmt temiz; `gen-a3-fixture.ts` etkilenmiyor. **J3'ün yedi dilimlik planı (J3-1..J3-7) TAMAMEN kapandı.** |

**J3'ün yedi dilimlik planı (J3-1..J3-7) 2026-09-05'te TAMAMEN kapandı (D-212) — ve onunla
birlikte Faz 9'un kendi üç dilimlik planı da (J1/J2/J3) TAMAMEN kapandı.** Sıradaki faz
`SPEC.md` §6'ya göre **Faz 10 — "AI review & layout"** (A3 yerleşim optimize edici, hücre
bütçesine sıkıştırma, mock-denetçi incelemesi, TR↔EN çeviri, maliyet sayacı); kendi kapsam
belirleme oturumunu (Faz 8/9'un emsali gibi) hak ediyor, henüz yazılmadı.

## Faz 10 — `SPEC.md` §6'nın kendi sıradaki fazı: AI review & layout

`SPEC.md`'nin faz tablosu: "A3 placement optimizer, condensation to cell budget, mock-auditor
review, TR↔EN translation, cost meter — Done when: Assistant rewrites an overflowing A3 into
budget without losing meaning, and flags a weak root cause on a deliberately-bad project."
Faz 8/9'un kendi emsali: ölçüm önce, sonra dilim. Faz 9'un aksine (J3'ün "50 method, sıfır
yeni mimari karar" deseni) bu fazın beş alt-parçası GERÇEKTEN dört yeni mekanizma gerektiriyor
— zaten var olan bir mekanizmanın küçük bir uzantısı değil.

**Kapsam belirleme BİTTİ 2026-09-05 (D-213).** §0'ın kendi ön taraması gerçek koda karşı
doğrulandı, birebir eşleşti. Kendi taramam üç yük taşıyan bulgu ekledi: (1) mock-auditor
review'ın (K2) §8.10 madde 4'ü ile `evaluateReadiness`'in (D-196) S1-S8 kuralları arasında
GERÇEK çakışma var — S5 zaten "kök nedensiz karşı önlem"i flagliyor, K2'nin bunu AI'ya bir
daha sordurması G2'nin (tekrar) ihlali olurdu; (2) cost meter'ın (K4) veri kaynağı sorusu
yeni bir Vorion doğrulama turu gerektirmeden zaten cevaplı — `vorion.rs` D-200'ün zaten
doğruladığı token sayaçlarını (Synchronous Prediction) ve model-başına `cost_per_*` alanlarını
(List LLMs) bilerek okumuyor, veri zaten dokümante edilmiş; (3) prompt kütüphanesinin
`{step, methodId}`-anahtarlı adresleme şeması K1/K2/K3'ün tüm-projeye-bakan promptlarına hiç
uymuyor, K1'in kendi işi olacak küçük bir uzantı. Dört gerçek açık soru `AskUserQuestion` ile
Barış'a soruldu, dördü de önerilen seçenekle onaylandı: K2 evaluateReadiness'e **ek/tamamlayıcı**
(yeniden hesaplamaz); K1'in diff-preview'ı RightPanel'e kalıcı **4. sekme ("Review")**; TR↔EN
çeviri **ikisi de** (alan-bazlı + proje geneli, `project.meta.language`'ı sessizce
değiştirmez); önerilen dört dilimlik plan doğru sınır, tek düzeltmeyle — §8.10 madde 4
(anlatı kopuklukları) K1'den K2'ye taşındı (mock-auditor'la aynı "bulgu listesi" şekli).
Tam kayıt: D-213.

| Dilim | Kapsam | Durum |
|---|---|---|
| Kapsam belirleme — beş alt-teslimatın veri durumu + `evaluateReadiness`/cost-data çakışma taraması + dilim planı | `docs/oturumlar/faz10-kapsam-belirleme.md` | ✅ BİTTİ 2026-09-05 — D-213, dört soru `AskUserQuestion` ile cevaplandı (hepsi önerilen seçenek). |
| K1 — A3 yerleşim optimize edici + hücre bütçesine kısaltma (§8.10 madde 1-3): diff-preview proposal türü + RightPanel'in yeni "Review" sekmesi | `docs/oturumlar/K1-yerlesim-kisaltma.md` | ✅ BİTTİ 2026-09-05 — D-214. Prompt kütüphanesi `whole-project/` uzantısı (§2.1), `layoutReview.ts` (Zod diff şeması, korunan-token doğrulaması, `buildA3Layout`'un `overflowWarnings`'ini yeniden kullanan bağlam kurucu, tek-birleşik-retry orkestrasyonu), `LayoutReviewPanel.tsx` (RightPanel'in 4. sekmesi, granüler checkbox'lı diff). P-55 filed. |
| K2 — Mock-auditor review (§8.6 Review modu) + anlatı kopukluğu tespiti (§8.10 madde 4) BİRLEŞİK — `evaluateReadiness`'in S1-S8'ini okuyup tamamlayan bir AI-bulgu paneli | `docs/oturumlar/K2-mock-auditor-anlati-kopuklugu.md` | ✅ BİTTİ 2026-09-05 — D-215. Panel yeri **yeni 5. sekme ("Denetim")**, P-46 **CLOSED** (dördüncü kategori olarak eklendi), bulgu durumu **taze/kalıcısız** — üçü de Barış'ın önerilen seçenekle onayı. `entrySummary.ts` (K1'den paylaşılan per-entry özetleme), `mockAudit.ts` (kendi bağlam kurucusu + `proposeStructuredEntry`'nin doğrudan yeniden kullanımı, K1'in birleşik-retry'ına gerek yok), `mock-audit.v1.md`, `MockAuditPanel.tsx`. D-62'nin fixture corpus'u beşinci bir kind kazandı (`deliberately-bad.ppsx`) — Faz 10'un "flags a weak root cause" acceptance senaryosu gerçek bir fixture + sahte `LlmProvider` yanıtına karşı bir PROBE testiyle kanıtlandı. |
| K3 — TR↔EN çeviri (alan-bazlı + proje geneli) | `docs/oturumlar/K3-tr-en-ceviri.md` | ✅ BİTTİ 2026-09-06 — D-216. İki `AskUserQuestion` turu: korunan-token doğrulaması K1'in birebir kontrolünü DEĞİŞTİRMEDEN yeniden kullanıyor, rapor-geneli mod tamamen `RightPanel`'in kendi kendine yeten yeni 6. sekmesinde ("Çeviri") yaşıyor — D-213'ün önerdiği "Settings tetikler" ayrımı DEĞİL. `EntryTranslateField.tsx` (koşulsuz, her method'da görünür — `EntryProposalField`'ın aksine `plugin.aiProposal`'a bağlı değil), `entryTranslation.ts` (alan-bazlı + rapor-geneli her ikisi için de K1'in primitiflerini yeniden kullanan birleşik-retry), `TranslateReportPanel.tsx`, iki yeni prompt dosyası (`translate-entry.v1.md`/`translate-report.v1.md`). `project.meta.language` hiçbir Accept ile değişmiyor (D-213 LOCKED, test edildi). P-56 (kısa alan/meta-başlık kapsamı dışı) ve P-57 (gerçek bir `meta.language.set` komutu yok) filed. |
| K4 — Maliyet sayacı + `ai-log.jsonl` + Settings spend cap — K1-K3'ün ürettiği gerçek `complete_structured` trafiğinden SONRA anlamlı | `docs/oturumlar/K4-maliyet-sayaci.md`, devamı `docs/oturumlar/K4-maliyet-sayaci-devam.md` | ✅ BİTTİ 2026-09-06 — D-221, **Faz 10'un dört dilimlik planı (K1-K4) TAMAMEN kapandı**. İki oturum: ilki mimariyi kurdu (plumbing (b) — Rust kendi başına loglar; sidecar `ai-log/{project_id}.jsonl`; hem per-project hem global per-month running total; spend cap `AiSettings.spend_cap_usd`), ikincisi tek blokajı kapattı — gerçek Vorion Response Schema alan adları (`input_tokens`/`output_tokens`, doğrudan `cost` alanı YOK; Vorion'un kendi chatbot'unun önerdiği `cost`/`total_cost` tahmini D-199'un "chatbot'a güvenme" dersiyle bilerek reddedildi). Barış'a maliyet/cap yaklaşımı soruldu, kararı oturuma bıraktı — seçilen hibrit yol: spend cap yalnızca YAPILANDIRILDIĞINDA `List LLMs`'in `cost_per_input_token`/`cost_per_output_token`'ını okuyup hesaplıyor (cap yokken sıfır ek ağ çağrısı). `find_pricing_in_items` mutasyon-doğrulandı. P-60 (accepted-korelasyonu yok) ve P-61 (tam-gövde loglama ayarı inşa edilmedi) filed. SPEC.md §8.13'ün "inside the `.ppsx`" lafzı sidecar'a göre düzeltildi. |

## Workspace Yüzey Yenilemesi — `SPEC.md`'nin Faz tablosu DIŞINDA, D-149'un "Oturum" emsaliyle

Faz 10'un AI-katmanı işinden bağımsız, Barış'ın kendi isteğiyle açılan bir UX girişimi: adım
kartlı bir iniş görünümü, adıma-özel bir sayfada method seçimi + giriş + o adımın kendi A3
bloğunun canlı-kırpılmış önizlemesi + aynı yerde AI desteği. **Kapsam belirleme BİTTİ
2026-09-06 (D-217).** Üç mimari soru `AskUserQuestion` ile soruldu, üçü de önerilen seçenekle:
(1) `StepStepper`'ın rail'i kaldırılıyor, yerine kartlı iniş görünümü + adım sayfasının kendi
hızlı-atlama şeridi; (2) AI desteği yeni bir mekanizma değil — `EntryProposalField`/
`EntryTranslateField` modal'dan sayfa-içine TAŞINIYOR; (3) canlı önizleme yeni bir renderer
değil — gerçek `HtmlA3Renderer`/`A3LayoutDescriptor`'ın `TemplateBlock`'tan türetilen bir CSS
viewport'una KIRPILMASI. `RightPanel`'in altı sekmesi DEĞİŞMİYOR (hepsi proje-geneli) —
**W2'nin kendi Block Visual Verification Loop turunda Barış bu son kararı bilerek tersine
çevirdi** (D-217 §2.4/D-228): `RightPanel`'in tamamı kaldırıldı, dört proje-geneli aracı
(İzlenebilirlik/İnceleme/Denetim/Çeviri) `WorkspaceTopBar`'ın yeni "Proje araçları" grubuna,
tam A3 önizlemesi (D-133'ün pop-out penceresi) bir düğmeye, Assistant ise kendi adıma-özel
sütununa taşındı — bkz. D-228. **Bu girişimin üç dilimlik planı (W1+W2+W3) ARTIK TAMAMEN
KAPALI — D-229, 2026-09-08.** Tam kayıt: D-217/D-228/D-229.

| Dilim | Kapsam | Durum |
|---|---|---|
| Kapsam belirleme — üç mimari sorunun `AskUserQuestion` ile cevaplanması + üç dilimlik plan | `docs/oturumlar/W-kapsam-belirleme.md` | ✅ BİTTİ 2026-09-06 — D-217. |
| W1 — İniş görünümü + navigasyon değişimi (rail kaldırılıyor, sekiz adım kartı, hızlı-atlama şeridi) | Tasarım: `docs/oturumlar/W1-adim-genel-bakis.md`. İnşa: `docs/oturumlar/W1-insa.md`. | ✅ TAM BİTTİ — tasarım (D-218, 4 tur) + kod (D-219, 2026-09-06). `activeStepId: StepId \| null`, `StepStepper` silindi, `StepOverview.tsx`/`StepQuickJump.tsx` yeni, `StepPage`'in başlığı locale-aware upper-case. |
| W2 — Adım sayfasının kendisi: `EntryEditorDialog`'un modal'dan sayfa-içi (accordion) bir düzenleme alanına dönüşümü + adım-özel AI destek sütunu (P-59) + `RightPanel`'in tamamen kaldırılıp dört aracın üst şeride taşınması | `docs/oturumlar/W2-adim-sayfasi.md` | ✅ TAM BİTTİ — tasarım (D-228, iki `AskUserQuestion` turu + iki maket revizyonu) + kod, 2026-09-08. |
| W3 — Canlı, adıma-kırpılmış A3 önizlemesi (`A3PreviewReservedBand`'ın kendi yer tutucusunu gerçek bir kırpılmış `HtmlA3Renderer` görünümüyle doldurması, performans ölçümü) | `docs/oturumlar/W3-canli-onizleme.md` | ✅ TAM BİTTİ — D-229, 2026-09-08. Gerçek Chromium ölçümü (`npx playwright`) → tek build (WorkspaceShell) + 600ms debounce; yeni `blockRectForStep.ts`; debounce eklerken bulunan gerçek bir yarış durumu da düzeltildi. **D-217'nin üç dilimlik planı (W1+W2+W3) TAMAMEN KAPALI.** |

## Faz 11 — `SPEC.md` §6'nın kendi sıradaki fazı: kalan şablonlar + template switching + `BenefitCase`

`SPEC.md`'nin faz tablosu: "Remaining templates (`farplas-7step-plus`, `farplas-7step-en`,
`pps-8step-auto`), template switching, `BenefitCase` and the `Onay formu` calculator — Done
when: Switching a project between all four templates preserves every entry and warns before
anything moves to an appendix." Bu lafız 2026-08-02'de (D-95) yazıldığında `pps-8step-auto`
yalnızca bir isimdi. O tarihten bu yana D-149'un dört oturumluk kolu (Oturum A, B1-B3, C1-C6,
D1-D2b) Rev00-tabanlı 8-step template'i çok somut bir noktaya getirdi — gerçek pt-cinsinden
geometri (§12), sekiz bloğun HEPSİNİN onaylı görsel dili (§14), esnek tahsis modeli (D-158/159/
160, LOCKED), `placeZones.ts`'te gerçek bir kusur bulup düzeltme (D-189/190) — ama bu çalışma
yalnızca `pps-8step-auto`'ya odaklandı, SPEC'in lafzındaki diğer üç kalemi (`-plus`/`-en`/
`BenefitCase`) hiç ölçmedi.

**Kapsam belirleme BİTTİ 2026-09-06 (D-223).** §0'ın kendi ön taraması gerçek koda karşı
doğrulandı, birebir eşleşti — `templateId` şemada var ama `a3Preview.ts` hiç okumuyor (template
seçimi bugün tamamen ölü kod), `budget.ts` tamamen statik, header identity band alanları
(`priority`/`targetClosureDate`/`generalRag`) `ProjectMetaSchema`'da yok, `BenefitCase` hiçbir
yerde yok. Dört `AskUserQuestion`, dördü de Barış'ın kendi seçimiyle (üçü bu oturumun önerisinin
DIŞINDA, daha dar bir yol seçildi): (1) kapsam **yalnızca `pps-8step-auto` + template-switching**
— `-plus`/`-en` **P-62**'ye, `BenefitCase` P-18'e eklenen bir notla filed, ikisi de Faz 11'in
dışında, kendi gelecekteki scope oturumunu bekliyor; (2) template registry kendi erken/bağımsız
dilim DEĞİL, yeni şablonun statik geometrisiyle (L1) birlikte; (3) esnek tahsis solver'ı (D-158/
159/160) ilk sürümde DEĞİL — statik önce, solver ayrı bir sonraki dilim (L3), P-40 güncellendi;
(4) P-43'ün görsel onayı ayrı/hemen DEĞİL, yeni şablonun kendi ilk Block Visual Verification
Loop turuna bağlı — o tur zaten B3'ün TÜM maketlerinin çizildiği idealize `pps-8step-auto`
tuvaline (§15.8) karşı gerçek kodu doğrulayacağı için doğal bir uygulama-sadakati kontrolü
olacak, ve `pps-8step-auto`'nun temiz 12-kolonlu ızgarasında D-189'un gutter-kolonu kusuru
yapısal olarak hiç oluşamıyor. İki nokta doğrudan karara bağlandı (Anayasa Madde 9, bilgi zaten
elde): ADIM 1'in problem-statement paneli yeni bir plugin DEĞİL — D-162 (LOCKED) zaten
`gapStatement`'ın `renderToA3`'üne D-102'nin zaten var olan zones/image mekanizmasını uygulamayı
çözmüştü; Genel RAG alanı D-153/D-165'in zaten rezerve ettiği amber + Layer A'nın kırmızı/yeşili
ile manuel bir `red|amber|green` select olarak eklenir (§13.4 madde 7 kapanıyor). Tam kayıt:
D-223.

| Dilim | Kapsam | Durum |
|---|---|---|
| Kapsam belirleme — §0 taraması + dört `AskUserQuestion` + üç dilimlik plan | `docs/oturumlar/faz11-kapsam-belirleme.md` | ✅ BİTTİ 2026-09-06 — D-223, dört soru `AskUserQuestion` ile cevaplandı (üçü bu oturumun önerdiği seçeneğin DIŞINDA — Barış daha dar bir kapsam seçti). |
| L1 — `pps-8step-auto`: statik sayfa geometrisi (§12.1-12.3) + template registry (`a3Preview.ts`'in `project.templateId`'yi gerçekten okuması + proje-oluşturma seçici UI) + blok görsel dili (D-47/D-165 paleti + header identity band + `gapStatement`'ın ADIM 1 zones/image genişlemesi), kendi ilk Block Visual Verification Loop onay turuyla kapanır (P-43'ü de kapatır) | `docs/oturumlar/L1-pps-8step-auto.md` | **TAMAMEN BİTTİ (D-224, 2026-09-07) — Barış artifact'i onayladı, P-43 KAPANDI.** Template seçici UI Barış'ın kararıyla YAPILMADI — yalnızca Rev00 kullanılıyor, bunun yerine yeni bir dil (TR/EN) seçici dialog. `place.ts`'te gerçek, önceden belgelenmemiş bir üretim kusuru bulunup düzeltildi (D-224 — zoned bir entry artık `zonesRowSpan` ile bloktan yalnızca kendi payını istiyor, `farplas-7step-tr`'yi de düzeltiyor). Gerçek bir `.xlsx` üretilip XML'i doğrudan okunarak doğrulandı, artifact: `https://claude.ai/code/artifact/5eb75eb2-2e0c-45ca-94f2-eee0d3e21a03`. Onay sırasında Barış'ın kendi sorusu L3'ün (D-158/159/160) kolon-içi elastik tahsis tasarımını bağımsız doğruladı; yazı-küçültme önerisi D-40'ın basılı okunabilirlik tabanıyla çeliştiği için reddedildi. Yeni bulgu **P-63** (kpiStrip ADIM 7'de her zaman appendix'e düşüyor) bilerek bu dilimde çözülmedi, L2'nin kendi §0'ı bekliyor. `npm test` 1433/1433, `cargo test` yeşil. |
| L2 — Template switching mekanizması: `farplas-7step-tr` ↔ `pps-8step-auto` arası geçiş, preserve-every-entry + appendix-öncesi uyarı (SPEC'in kendi lafzî done-koşulu) | `docs/oturumlar/L2-template-switching.md` | **TAMAMEN BİTTİ (D-225, 2026-09-07).** `templateId.set` komutu + `SettingsScreen`'in kalıcı "Template" bölümü + `previewTemplateSwitch` dry-run mekanizması (D-100'ün zaten var olan `droppedEntryIds`'ini okuyor, yeniden icat etmiyor). Gerçek koda karşı uçtan uca doğrulandı (geçici probe script, D-136 disipliniyle silindi) — 61 entry'li bir proje iki kez switch'ten geçti, hiçbiri kaybolmadı. `npm test` 1448/1448, `cargo test` yeşil (Rust dokunulmadı). |
| L3a — Esnek tahsis solver çekirdeği (D-158/159/160): `TemplateBlock.elastic` + `resolveElasticBlocks`, L1'in statik varsayılanlarını gerçek per-proje elastik modele yükseltir. `pinned`/drag-handle YOK | `docs/oturumlar/L3-esnek-tahsis-solver.md` | **TAMAMEN BİTTİ (D-226, 2026-09-07).** Dört `AskUserQuestion`, dördü de önerilen seçenek: kapsam yalnızca `pps-8step-auto`, `pinned` kalıcı olacak (L3b'nin işi), talep bağımsız yeni bir saf fonksiyon (`estimateBlockRowDemand`), drag-handle (L3b) renderer'ın DIŞINDaki bir overlay katmanında. D-160'ın kendi sayısal örneği (ADIM 2'nin 33 toplam satıra büyümesi) bağımsız bir testte birebir yeniden üretildi. G2: üçüncü tekrardan önce `resolveEntryContent`/`entriesByBlock.ts` çıkarıldı. `farplas-7step-tr` hiç dokunulmadı (hiçbir bloğu `elastic` değil). `npm test` 1464/1464, `cargo test`/`clippy`/`fmt` temiz (Rust dokunulmadı), fixture sıfır fark. |
| L3b — `pinned` domain alanı/komutu + drag-handle arayüzü (D-170), L3a'nın gerçek solver'ı üzerine manuel override | `docs/oturumlar/L3b-pinned-drag-handle.md` | **TAMAMEN BİTTİ (D-227, 2026-09-07) — Faz 11'in üç dilimlik planı (D-223) artık TAMAMEN kapandı.** Launch prompt'un dört sorusu bir `AskUserQuestion` turunda, dördü de önerilen seçenek: `ProjectModel.blockPins` (meta. öneki yok), tek `blockPins.set` komutu (tüm harita), `resolveElasticBlocks`'a saf bir ek parametre (`pinnedCanvasRowsByStepId`), drag-handle yalnızca ekran modu + bırakınca commit. Beşinci soru ("Drag-handle nedir?" sonrası) — Barış ÖNERİLENİN TERSİNİ seçti: drag-handle hem RightPanel'in küçük panelinde HEM DE büyük pop-out pencerede (A3PreviewWindow, D-133) çalışacak; bu, A3PreviewWindow'un kendi store'u olmaması nedeniyle yeni bir ters-yön IPC olayı gerektirdi (`A3_PREVIEW_PIN_REQUEST_EVENT`/`requestBlockPin`/`listenForBlockPinRequest`). İki gerçek hata (zoom-scale'i hesaba katmayan drag matematiği, pop-out'un pan handler'ına sızan pointer olayları) kodlanırken yakalanıp mutasyon-doğrulandı. `npm test` 1524/1524, `cargo test`/`clippy`/`fmt` temiz (Rust dokunulmadı). Yeni **P-64** (bir kolonun son bloğunun kendi tutamacı yok, YAGNI). |

Filed, planlanmamış (Faz 11'in dışında): **P-62** (yeni — `farplas-7step-plus`/`farplas-7step-en`,
D-149'un hiçbir oturumu hiç dokunmadı), **P-18** (güncellendi — `BenefitCase`/`Onay formu`).

## Faz 12 — `SPEC.md` §6'nın kendi SONUNCU fazı: polish, i18n TR/EN complete, PDF/PNG export, packaging, signing, auto-update

`SPEC.md`'nin faz tablosu: "Polish, i18n TR/EN complete, PDF/PNG export, packaging, signing,
auto-update — Done when: Signed installers for both platforms." Altı ayrı iş kalemini tek
satırda sıkıştırıyordu, gerçek kod tabanında hiçbiri inşa edilmemişti.

**Kapsam belirleme BİTTİ 2026-09-08 (D-230).** §0'ın kendi ön taraması gerçek koda karşı
doğrulandı, promptun beş bulgusunun beşi de eşleşti: hiçbir üretim dosyasında PDF üretimi yok,
ayrı bir PNG-export akışı yok, `tauri.conf.json`'da `updater`/`plugins` boş, CI bilinçli imzasız
bundle üretiyor. Bu oturumun kendi ek ölçümü: TR/EN anahtar sayısı **957/957 tam eşleşiyor**;
`kontrol-dil.sh` bu projeye karşı **KAPSAM DIŞI** döndü (0 dosya — yalnızca Swift/Python kapsıyor,
bu proje TS/Rust, D10 tamamen ELLE yürünüyor) — launch prompt'un "muhtemelen bu betiği
çalıştıracak" varsayımı YANLIŞ çıktı, bu betiğin bu depo için hiçbir zaman gerçek kapsama
sağlamadığı ilk kez bu oturumda doğrulandı. Beş `AskUserQuestion` + auto-update seçiminden sonra
bulunan bir engelin kendi ek turu: (1) **PDF export** ertelendi → **P-65**; (2) **Packaging/
signing** → imzasız kalıcı, iç-kurumsal araç kabul edildi (Barış'ın kendi seçimi, önerilenin
DIŞINDA); (3) **Auto-update** → Faz 12'nin içinde, GitHub Releases üzerinden tam otomatik — ama
repo private olduğu için (`gh repo view` ile doğrulandı) private-repo Release asset'lerinin
kimlik doğrulaması gerektirmesi üretim-engelleyici bir bulgu doğurdu; ikinci turda Barış'ın
kararı: **repo public yapılsın** (gerçek uygulama M2'nin kendi ilk adımı, kendi ayrı onayıyla —
geri-alınması zor bir eylem); (4) **i18n "complete"** → mekanik tarama + anahtar eşliği yeterli,
ama "mekanik tarama"nın (kontrol-dil.sh) sıfır kapsam sağladığı bulgusuyla M1 küçük bir elle-grep
dilimine daraldı; (5) **"Polish"/P-58** → P-58 ayrı kalsın, Faz 12'nin kendi "polish"i
CLAUDE.md'nin hiç sistematik denetlenmemiş Quality floor listesini kapsar. Tam kayıt: D-230.

| Dilim | Kapsam | Durum |
|---|---|---|
| Kapsam belirleme — §0 taraması + beş `AskUserQuestion` (+ bir ek engel turu) + dört dilimlik plan | `docs/oturumlar/faz12-kapsam-belirleme.md` | ✅ BİTTİ 2026-09-08 — D-230. |
| M1 — i18n: TR/EN anahtar eşliği doğrulaması (zaten 957/957) + `kontrol-dil.sh`'ın bu proje için KAPSAM DIŞI olduğunun kaydı + bilinen-desen (D-219 sınıfı: `.toLocaleUpperCase`/tarih biçimlendirme/sıralama) sınırlı bir elle grep taraması | `docs/oturumlar/M1-i18n-tarama.md` | Başlanmadı. |
| M2 — Auto-update: repo'yu public yapma (kendi onayıyla) + `tauri-plugin-updater` kurulumu + CI'ye release-publish adımı + Settings'e "check for updates" UI'si | `docs/oturumlar/M2-auto-update.md` | Başlanmadı. D-44'ün kendi "revisit once a real release process exists" tetikleyicisi burada çözülür. |
| M3 — Packaging/signing kapanışı: D-44/D-46'yı "kalıcı imzasız, iç-kurumsal" durum olarak kapatan küçük bir kod+SÜREÇ dilimi (bundle metadata doğrulaması + sınırlı bir SmartScreen/Gatekeeper SÜREÇ yürüyüşü) | `docs/oturumlar/M3-paketleme-imza-kapanisi.md` | Başlanmadı. |
| M4 — Polish: CLAUDE.md'nin kendi Quality floor listesinin (klavye nav, focus ring, WCAG AA kontrast, reduced motion, layout shift, unhandled rejection, console noise) proje çapında ilk sistematik denetimi | `docs/oturumlar/M4-polish-kalite-tabani.md` | Başlanmadı. |

Filed, planlanmamış (Faz 12'nin dışında): **P-65** (yeni — PDF/PNG export, gerçek ihtiyaç
doğmadan YAGNI), **P-58** (bilinçli olarak Faz 12'ye dahil edilmedi, kendi ayrı oturumu).

## P-62 kapsam belirleme — `farplas-7step-plus`/`farplas-7step-en`

`docs/oturumlar/P62-kalan-sablonlar-kapsam.md` — D-149'un dört oturumluk (Oturum A/B1-B3/
C1-C6/D1-D2b) derinliğini hiç almamış iki şablonun kendi kapsam-belirleme oturumu.

**§0 taraması + kanıt toplama BİTTİ 2026-09-08 (D-231) — kapsam kararı kendisi PENDING
kaldı.** Bu oturum izole bir git worktree'de (paralel/arka-plan ajan bağlamı) çalıştı ve
`AskUserQuestion` aracı ortamında hiç mevcut değildi (`ToolSearch` ile arandı, bulunamadı) —
bu yüzden Barış'a gerçek zamanlı soru sorulamadı, fabrik edilmiş bir "Barış'ın seçimi" YAZILMADI.
Bunun yerine §0'ın kendi doğrulaması gerçek koda karşı çalıştırıldı (`registry.ts` yalnızca
`farplas7StepTr`/`pps8StepAuto` tanıyor, `SPEC.md` hâlâ eski üç-şablon lafzını taşıyor, D-95
hâlâ SUPERSEDED işaretlenmedi) ve **depoda zaten duran ama hiç bu soruya bağlanmamış gerçek
kanıt** bulundu: `reference/TEMPLATE_ANALYSIS.md` §9.5/§9.6 (2026-08-01, Faz 4'ten önce
yazılmış) `-en` ile `-tr`'nin GERÇEKTEN farklı geometriler olduğunu zaten kanıtlıyor — TR'de
spacer satırı yok, başlık satırları farklı yükseklikte, ve kayıp taksonomisi kategori sayısı
gerçekten farklı (ENG 7, TR 8 — Maintenance ikiye bölünmüş). Sonuç: `-en`'in D-188'in zaten
inşa edilmiş i18n mekanizması (yalnızca dışa aktarım etiketlerini çevirme) üzerine bina
edilebileceği varsayımı YANLIŞ çıktı — gerçek geometri farkı var, ama analiz zaten ~%95 hazır.
`-plus` için ayrı bir gerçek gerilim bulundu (pps-8step-auto'nun onayı `-plus`'ın "re-approval
gerektirmeden" gerekçesini kısmen zayıflatıyor, ama pps-8step-auto mevcut basılı formun yerine
geçmiyor, `-plus`'ın değer önerisi teorik olarak ayakta kalabilir) — kod okumakla çözülemeyen
gerçek bir iş-önceliği kararı. Ayrıca rastlantısal, P-62'den bağımsız gerçek bir gap bulundu:
**P-66** — zaten şevk edilmiş `tpmLossTaxonomy` (D-122) ENG'in 7-kategorili listesini
kullanıyor, gerçek TR formunun (farplas-7step-tr'nin byte-faithful olduğu iddia edilen kaynak)
8-kategorili listesi değil.

`P62-kalan-sablonlar-kapsam.md`'nin kendi §2.1'i bu kanıtla keskinleştirildi — iki soru, üç
seçenekle (build / YAGNI-kapat / ertelensin), bir sonraki interaktif oturumda doğrudan
`AskUserQuestion` ile çalıştırılmaya hazır. Tam kayıt: `DECISIONS.md` D-231, P-62'nin kendi
"Update 2026-09-08" notu, yeni **P-66**.

## Sıradaki iş — Faz 12 kapsam belirleme artık BİTTİ, üç bağımsız aday + dört yeni M-dilimi bekliyor

W3 ile D-217 girişimi (W1+W2+W3) ve Faz 11'in kendi üç dilimlik planı (L1+L2+L3a+L3b) ikisi de
2026-09-08'de TAMAMEN kapandı. Aynı gün yazılan dört bağımsız adaydan biri — **Faz 12 kapsam
belirleme — artık BİTTİ (D-230)**, kendi dört M-dilimini (yukarıdaki "Faz 12" bölümü) doğurdu.
Kalan üç aday hâlâ başlamadı:

| Aday | Prompt | Ne | Kod mu, kapsam mı |
|---|---|---|---|
| ~~Faz 12 kapsam belirleme~~ | ~~`docs/oturumlar/faz12-kapsam-belirleme.md`~~ | **BİTTİ (D-230, 2026-09-08)** — bkz. yukarıdaki "Faz 12" bölümü, M1-M4 | Kapsam belirleme TAMAMLANDI, KOD YOK — dört yeni launch prompt yazıldı |
| ~~P-62 kapsam belirleme~~ | ~~`docs/oturumlar/P62-kalan-sablonlar-kapsam.md`~~ | **§0 taraması + kanıt toplama BİTTİ (D-231, 2026-09-08) — kapsam kararının kendisi PENDING** (`AskUserQuestion` bu oturumun ortamında yoktu). Gerçek kanıt bulundu: `-en` gerçek bir geometri farkı (§9.5/§9.6), `-plus` gerçek bir iş-önceliği gerilimi. İki soru artık kanıtla keskinleştirilmiş, hazır — bkz. yukarıdaki "P-62 kapsam belirleme" bölümü | Kapsam belirleme TAMAMLANDI, KOD YOK — iki soru bir sonraki interaktif oturumda `AskUserQuestion` ile çalıştırılmaya hazır |
| P-58 | `docs/oturumlar/P58-gorsel-dil-yayilmasi.md` | W1'in Farplas görsel dilini (D-218) `src/ui/`'nin 12 primitifine yayma — kendi filed notunda "yüksek patlama-yarıçapı" uyarısı | Gerçek kod, kendi ilk `AskUserQuestion` turuyla açılıyor |
| Küçük açık maddeler | `docs/oturumlar/kucuk-acik-maddeler.md` | P-63 (kpi-strip'in ADIM 7'de her zaman appendix'e düşmesi) + P-64 (bir kolonun son bloğunun kendi sürükleme tutamacı yok) — ikisi de zaten iyi tanımlanmış, küçük düzeltmeler | Gerçek kod, doğrudan başlanabilir |
| M1-M4 (Faz 12'nin kendi dilimleri) | `docs/oturumlar/M1-i18n-tarama.md` / `M2-auto-update.md` / `M3-paketleme-imza-kapanisi.md` / `M4-polish-kalite-tabani.md` | i18n taraması, auto-update, packaging/signing kapanışı, Quality floor denetimi — bkz. yukarıdaki "Faz 12" bölümü | Gerçek kod, M1/M4 bağımsız+paralel, M2 kendi tek onaylı ilk adımıyla (repo public), M3 M2'den bağımsız |

**Paralel çalıştırma değerlendirmesi** (Barış'ın kendi sorusu, 2026-09-08): bu depo bugüne kadar
HİÇBİR zaman worktree/branch-bazlı paralel oturum kullanmadı — her oturum doğrudan `main`'e
commit etti (git geçmişi tamamen doğrusal). Gerçek eşzamanlı çalışma bu yüzden ayrı git
worktree'ler/branch'ler gerektirir, ve DÖRDÜ de kapanışta AYNI iki dosyaya (`DECISIONS.md`,
bu README) ekleme yapıyor — bu, tamamen otomatik hiçbir birleştirmenin olmayacağı, ama kolay
(ekleme-sonuna-ekleme, çakışsa bile elle çözümü bariz) bir birleştirme maliyeti demek. Üretim
kodu seviyesinde dosya çakışma riski:

- **Faz 12 kapsam belirleme + P-62 kapsam belirleme**: DÜŞÜK risk, paralel çalıştırılabilir —
  ikisi de "kod yok," yalnızca kendi yeni dosyalarını + DECISIONS.md/README.md'nin sonunu
  değiştiriyor. **İkisi de artık BİTTİ** (Faz 12: D-230, tam kapandı; P-62: D-231, §0+kanıt
  bitti ama kapsam kararı kendisi `AskUserQuestion`'ın bu ortamda yokluğu nedeniyle PENDING).
- **Küçük açık maddeler**: DÜŞÜK risk, yukarıdaki ikisiyle VE kendi içinde paralel çalıştırılabilir
  — `src/methods/kpiStrip/` (P-63) ve `src/a3/render/BlockPinOverlay.tsx` (P-64) tamamen ayrı
  dosyalar, ikisi de Faz 12/P-62'nin dokunduğu hiçbir dosyaya değmiyor.
- **P-58**: YÜKSEK risk — kendi filed notunun "yüksek patlama-yarıçapı" uyarısı tam olarak bunu
  söylüyor: `src/ui/`'nin 12 primitifi uygulamanın HER yerinde kullanılıyor. Diğer üçüyle aynı anda
  çalıştırmak dosya-seviyesinde doğrudan çakışmasa bile (P-58 `src/ui/`'ye, diğerleri oraya
  dokunmuyor), SEMANTİK risk var — P-58 devam ederken başka bir oturumun `src/ui/` primitiflerini
  KULLANAN yeni bir bileşen eklemesi (örn. Faz 12'nin polish işi), P-58'in henüz bitmemiş görsel
  geçişiyle tutarsız bir sonuç doğurabilir. **Önerilen sıralama: P-58 YALNIZ çalıştırılsın —
  ya ilk (temiz bir zeminde) ya da diğer üçü bittikten sonra (artık değişmeyen bir uygulamanın
  üzerine son bir görsel geçiş olarak).**
- **M1-M4 (Faz 12'nin kendi dilimleri, 2026-09-08'de eklendi)**: M1 (i18n grep) ve M4 (Quality
  floor denetimi) DÜŞÜK risk — ikisi de küçük, dosya-seviyesinde P-62/küçük-açık-maddeler'le
  çakışmıyor, birbirleriyle de paralel çalıştırılabilir. **M2 kendi başına yürünmeli** — ilk
  adımı (repo'yu public yapmak) geri-alınması zor, GÖRÜNÜR bir eylem; bu adım tamamlanana kadar
  M2'nin geri kalanı (CI release-publish, `tauri-plugin-updater`) başlamamalı, ve M2 devam
  ederken P-58 gibi `src/ui/`'ye dokunan başka bir oturum aynı anda çalışmamalı (Settings'e
  eklenecek "check for updates" UI'si `src/ui/` primitiflerini KULLANIR). M3, D-44/D-46'yı
  yalnızca "kalıcı imzasız" olarak kapatan küçük bir dilim — M2'den bağımsız, herhangi bir
  sırada çalıştırılabilir.

**Barış'ın kendi seçimi bekleniyor** — bu tablo yalnızca aday listesi, hiçbiri henüz başlamadı.

## Kullanım

Yeni oturumu şu iki satırla başlat (dosya adını sıradaki oturuma göre değiştir):

```
Önce Anayasamızı Oku (~/.claude/ANAYASA.md).
Sonra ~/Developer/pps-hachi/docs/oturumlar/<sıradaki dosya>'yi oku ve uygula.
```

J3-1 BİTTİ (D-206, 2026-09-01, Adım 1'in 9 method'u). J3-2 BİTTİ (D-207, 2026-09-02, Adım 2'nin
9 method'u). J3-3 BİTTİ (D-208, 2026-09-02, Adım 3+4 birleşik, 10 method). J3-4 BİTTİ (D-209,
2026-09-02, Adım 5'in 7 method'u). J3-5 BİTTİ (D-210, 2026-09-05, Adım 6'nın 5 method'u). J3-6
BİTTİ (D-211, 2026-09-05, Adım 7'nin 5 method'u). J3-7 BİTTİ (D-212, 2026-09-05, Adım 8'in 5
method'u) — **J3'ün yedi dilimlik planının TAMAMI ve Faz 9'un kendi üç dilimlik planının
(J1/J2/J3) TAMAMI kapandı.** Faz 10'un kendi kapsam-belirleme oturumu BİTTİ (D-213,
2026-09-05, dört dilim: K1/K2/K3/K4). K1 BİTTİ (D-214, 2026-09-05, A3 yerleşim optimize
edici + hücre bütçesine kısaltma + RightPanel'in "Review" sekmesi). K2 BİTTİ (D-215,
2026-09-05, mock-auditor review + anlatı kopukluğu tespiti, `evaluateReadiness`'e
ek/tamamlayıcı, RightPanel'in "Denetim" sekmesi). K3 BİTTİ (D-216, 2026-09-06, TR↔EN
çeviri — alan-bazlı `EntryTranslateField` + RightPanel'in kendi kendine yeten "Çeviri"
sekmesi). K4'ün kendi launch prompt'u yazıldı (`K4-maliyet-sayaci.md`), henüz başlanmadı.
Ayrıca, Faz 10'dan TAMAMEN bağımsız yeni bir girişim açıldı: **Workspace Yüzey Yenilemesi**
(kendi Faz numarası yok, D-149'un "Oturum" emsali) — kapsam belirleme BİTTİ (D-217,
2026-09-06). W1'in kendi Block Visual Verification Loop turu da BİTTİ, maket onaylandı
(D-218, 2026-09-06) — dört turda palet/tipografi Barış'ın kendi isteğiyle Farplas'ın gerçek
kurumsal marka kimliğine taşındı (D-48'in eski token'ları yalnızca bu iki yeni yüzeyde
değişti, P-58 uygulama-geneli yayılımı için açık bırakıyor); ayrıca bir adım-özel AI destek
chatbox'ı isteği W2'nin kapsamına eklendi (P-59). **W1-insa BİTTİ (D-219, 2026-09-06)** —
D-218'in onaylı maketi gerçek koda döküldü: `activeStepId: StepId | null` (varsayılan artık
`null`, iniş görünümü), `StepStepper` silindi, yeni `StepOverview.tsx`/`StepQuickJump.tsx`,
`StepPage`'in başlığı locale-aware upper-case (`.toLocaleUpperCase("tr")`, Türkçe "İ" hatası
regresyon testiyle kilitlendi), `AssistantPanel`'in null-safety düzeltmesi, D-218'in yedi
Farplas token'ı + self-hosted Source Sans 3 additive olarak eklendi. `npm test` 1385/1385
(291 dosya), `npm run lint`/`npm run build` temiz, `cargo test`/`clippy`/`fmt` temiz (Rust
dokunulmadı). **W1 artık tasarım+kod ikisiyle de TAM BİTTİ.** W2'nin kendi launch prompt'u
yazıldı: `W2-adim-sayfasi.md`.

Aynı gün, ayrı bir oturumda, Barış'ın gerçek `npm run tauri dev` ekran görüntüsü D-219'un
kendi ikinci `[data-theme="dark"]` bloğunun fiilen ÇALIŞMADIĞINI ortaya çıkardı — **D-220**
(dark-mode regresyonu, kök nedeni Tailwind v4'ün `@theme` çıktısını bir CSS cascade
layer'a sarması, dev-server/prod-build arasında farklı davranıyor) gerçek bir Chromium'da
(geçici Playwright probe'u, kullan-sonra-sil) doğrulanıp `--surface`/`--ink`'in zaten
kanıtlanmış iki-katmanlı primitif deseniyle düzeltildi. P-58 ile karıştırılmamalı — ayrı,
gerçek bir kusurdu.

**Faz 10 — K4 (maliyet sayacı + `ai-log.jsonl` + Settings spend cap) BİTTİ (D-221,
2026-09-06) — Faz 10'un dört dilimlik planı (K1-K4) TAMAMEN kapandı.** İki oturumda: ilki
mimariyi kurdu (kendi bütçe kesintisiyle yarım kaldı, devamı `K4-maliyet-sayaci-devam.md`),
ikincisi Barış'ın paylaştığı gerçek Response Schema ekran görüntüsüyle tek blokajı kapattı —
`input_tokens`/`output_tokens` confirmed, doğrudan bir `cost` alanı YOK (Vorion'un kendi
chatbot'unun tahmini bilerek reddedildi, D-199'un aynı dersi). Maliyet/cap yaklaşımı
`AskUserQuestion` ile soruldu, Barış kararı oturuma bıraktı — seçilen hibrit yol: spend cap
yalnızca yapılandırıldığında `List LLMs`'in gerçek `cost_per_*` alanlarını okuyup hesaplıyor,
yapılandırılmamışken sıfır ek ağ çağrısı. P-60/P-61 filed. Tam kayıt: D-221.

**Faz 11'in kendi kapsam belirlemesi BİTTİ (D-223, 2026-09-06)** — `docs/oturumlar/
faz11-kapsam-belirleme.md`'nin işi tamamlandı, kod yazılmadı. Dört `AskUserQuestion`, dördü de
Barış'ın kendi seçimi (üçü bu oturumun önerisinin DIŞINDA): kapsam yalnızca `pps-8step-auto` +
template-switching'e daraltıldı (`-plus`/`-en` **P-62**'ye, `BenefitCase` P-18'e filed, ikisi de
Faz 11'in dışında); template registry kendi erken dilim değil, yeni şablonun statik geometrisiyle
(L1) birlikte; esnek tahsis solver'ı (D-158/159/160) ilk sürümde değil, statik önce, solver ayrı
bir sonraki dilim (L3); P-43'ün görsel onayı yeni şablonun kendi ilk Block Visual Verification
Loop turuna bağlı. ADIM 1'in problem-statement paneli (yeni plugin değil, `gapStatement`'ın
zones/image genişlemesi, D-162) ve Genel RAG alanı (manuel `red|amber|green`, D-153/D-165) bu
oturumda doğrudan karara bağlandı (Anayasa Madde 9). Üç dilimlik plan: **L1** (statik geometri +
registry + blok görsel dili + BVVL onayı), **L2** (template switching), **L3** (esnek solver +
drag-handle). Tam kayıt ve tablo: yukarıdaki "Faz 11" bölümü, `DECISIONS.md` D-223. L1'in kendi
launch prompt'u yazıldı: `docs/oturumlar/L1-pps-8step-auto.md`.

**Faz 11 — L1 TAMAMEN BİTTİ (D-224, 2026-09-07) — Barış artifact'i inceleyip onayladı, P-43
KAPANDI.** İki `AskUserQuestion` turu Barış'ın kendi kararıyla D-223'ün önerisinin DIŞINDA sonuçlandı:
template seçici UI hiç yapılmadı (yalnızca Rev00 kullanılıyor), onun yerine yeni-proje akışına
bir dil (Türkçe/İngilizce) seçici dialog eklendi; header identity band'ın üç yeni alanı
(`priority`/`targetClosureDate`/`generalRag`) SettingsScreen'in kalıcı yeni "Proje Bilgileri"
bölümünde. İnşa sırasında iki gerçek bulgu çıktı: (1) D-159'un ADIM 1 tasarımı (`fiveN1K` +
`gapStatement` aynı blokta iki ayrı zoned entry) `place.ts`'in D-102'den beri var olan, önceden
belgelenmemiş bir kusuruna çarptı — herhangi bir zoned entry bloğun kalan TÜM satırlarını
tüketiyordu, bu da bugün ŞİPPİNG EDİLMİŞ `farplas-7step-tr`'yi de etkiliyordu; yeni bir
`zonesRowSpan` alanıyla düzeltildi, mutasyon-doğrulandı; (2) gap-analizi grafiği sayısal veri
gerektiriyordu ama `gapStatement`'ın alanları serbest metin — Barış AskUserQuestion ile "uydurma
sayı yok, dürüst özet paneli" seçti. Temsili bir proje gerçek `buildA3Layout`+`write_a3_workbook`
zincirinden geçirilip üretilen GERÇEK `.xlsx` unzip edilip XML'i doğrudan okunarak doğrulandı
(sayfa/kolon/satır/renk/görsel — hepsi §12'yle birebir eşleşti); kanıt ve gerçek pt→px ölçekli
ADIM 1 mockup'ı bir Claude Artifact'te: `https://claude.ai/code/artifact/5eb75eb2-2e0c-45ca-94f2-eee0d3e21a03`.
Bu turda bulunan ayrı bir kusur (**P-63** — `kpiStrip` ADIM 7'nin 6 satırlık tuvaline asla
sığmıyor) bilerek bu dilimde çözülmedi. `npm test` 1433/1433, `npm run lint`/`tsc`/`build` temiz,
`cargo test`/`clippy`/`fmt` temiz (Rust dokunulmadı). Tam kayıt: `DECISIONS.md` D-224/P-63.

**Aynı gün, artifact onayı sırasında**: Barış kendi kolon-içi elastik tahsis önerisini sordu
(bir blok komşusunun boş satırından ödünç alsın) — bu D-158/159/160'ın (LOCKED) L3'e ertelenmiş
tasarımıyla birebir aynı çıktı, bağımsız doğrulandı. Yazı tipi/satır yüksekliği küçültme önerisi
D-40'ın (LOCKED) 8pt basılı okunabilirlik tabanıyla çeliştiği için reddedildi — gerçek cevap
D-100'ün appendix mekanizması (kırpma/küçültme yok, tam entry bir ek sayfaya taşınır). P-43/P-26
kapandı, D-224'ün kendi kapanış notuna işlendi.

**Faz 11 — L2 TAMAMEN BİTTİ (D-225, 2026-09-07) — Faz 11'in üç dilimlik planı artık L1+L2
kapanmış, yalnızca L3 kalıyor.** Oturumun kendi §0 ön-kontrolü P-43'ün eşzamanlı başka bir oturum
tarafından zaten kapatıldığını buldu — Barış'a yine de doğrudan soruldu, onay tazelendi; P-63 hâlâ
açık bulundu, ayrı dilim kararı yeniden doğrulandı. Bir `AskUserQuestion` turu (§3.3, ikisi de
Barış'ın önerilen seçeneği): switch kontrolü `SettingsScreen`'e kalıcı yeni bir "Şablon" bölümü
(ayrı sekme/diyalog değil); önizleme/uyarı basit bir `DialogRoot`/`DialogContent` onayı (K1'in
zengin diff-panel deseni değil — bu deterministik bir evet/hayır onayı). Tek yeni mimari
mekanizma: `previewTemplateSwitch` (`src/app/routes/settings/templateSwitch.ts`) — hedef
şablonla `buildA3Layout`'un yalnızca birinci (saf) çağrısını yapan bir kuru çalıştırma, D-100'ün
zaten var olan `overflowWarnings[].droppedEntryIds` mekanizmasını okur, "sığar mı" sorusunu asla
yeniden icat etmez. Yeni komut `templateId.set` (`meta.` ön eki YOK — `templateId` `ProjectModel`'in
doğrudan kendi alanı, `rounds.set`/`signOff.set`'in emsali) hiçbir entry'nin `a3Visibility`'sine
dokunmuyor — SPEC'in "preserves every entry" lafzı LOCKED okundu. Hedefte düşen entry yoksa switch
anında uygulanır, dialog açılmaz; en az biri düşecekse dialog listeler, Onayla/Vazgeç. Gerçek koda
karşı uçtan uca doğrulama (geçici script, D-136/D2 disipliniyle kullanılıp silindi): 61 `primary`
entry'li bir proje iki kez gerçek switch'ten geçirildi, her ikisinde de entry sayısı 61'de sabit
kaldı (hiç silinmedi), önizleme her iki yönde de gerçek düşen entry sayısını doğru bildirdi.
`npm test` 1448/1448 (296 dosya, 1433'ten yukarı — 15 yeni test), `npm run lint`/`tsc`/`build`
temiz, `cargo test`/`clippy`/`fmt` temiz (Rust dokunulmadı, doğrulandı). `scripts/gen-a3-fixture.ts`
yeniden çalıştırılmadı (bu dilim `src/a3/`'e hiç dokunmuyor). Kapsam dışı: L3, P-63 (ayrı dilim).
Tam kayıt: `DECISIONS.md` D-225. L3'ün kendi launch prompt'u aynı gün, Barış'ın isteğiyle yazıldı:
`docs/oturumlar/L3-esnek-tahsis-solver.md`.

**Faz 11 — L3a TAMAMEN BİTTİ (D-226, 2026-09-07).** `L3-esnek-tahsis-solver.md`'nin kendi §0'ı
gerçek koda karşı doğrulandı, dört gerçek açık tasarım sorusu bir `AskUserQuestion` turuyla
soruldu — dördü de Barış'ın önerilen seçeneği: kapsam yalnızca `pps-8step-auto` (D-158/159/160/170
zaten bu şablona göre tasarlandı); `pinned` kalıcı olacak (`.ppsx`'e, appStep anahtarıyla — ama
alanın/komutun kendisi L3b'nin işi); solver'ın talep-hesaplama mekanizması `placeBlockContent`'i
hiç değiştirmeyen bağımsız yeni bir saf fonksiyon; drag-handle (L3b) `HtmlA3Renderer`'ın DIŞINDA
ayrı bir overlay katmanında yaşayacak. D-114'ün kendi bütçe uyarısı doğru çıktı — üç gerçek
mekanizma (solver + `pinned` + drag UI) bir dilime sığmadı, oturum kendi kararını verdi (Anayasa
Madde 9) ve L3a (solver, bu oturumda BİTTİ) / L3b (`pinned` + drag-handle, ayrı launch prompt) diye
böldü. Yeni `TemplateBlock.elastic?: {minimumCanvasRows}` (opsiyonel, template-agnostik — bir blok
kendi isteğiyle katılır, `farplas-7step-tr` hiçbirini bildirmiyor); yeni
`src/a3/layout/elasticAllocation.ts` (`estimateBlockRowDemand` + `resolveElasticBlocks`, kolon
içinde deterministik dağıtım — bir bloğun varsayılanın altında dinlenmesi serbest kalan satırları
varsayılanın üstünde talep eden komşusuna, sırayla, kata kadar veriyor). **D-160'ın kendi sayısal
örneği** (ADIM 2'nin 33 toplam satıra büyümesi, ADIM 1/3 ikisi de floor'a inince) bağımsız bir
testte birebir yeniden üretildi. G2: üçüncü tekrardan önce iki paylaşılan modül çıkarıldı —
`resolveEntryContent` (`methodContract.ts`) ve `entriesByBlock.ts` (`buildA3Layout.ts`'in özel
fonksiyonlarıydı, artık `elasticAllocation.ts` da aynı "hangi entry hangi bloğa gider" mantığını
kullanıyor, ayrışma riski yapısal olarak kapatıldı). `buildA3Layout.ts`'in ana döngüsü artık
`resolveElasticBlocks`'un döndürdüğü listeyi geziyor; elastik bir bloğun başlık birleşmesi artık
dinamik ekleniyor (statik `MERGES`'ten çıkarıldı, yalnızca `pps-8step-auto.ts`'te). Uçtan uca
doğrulandı: gerçek `pps8StepAuto` + gerçek `buildA3Layout` ile 20 girişli dolu bir ADIM 2, boş
ADIM 1/3 — başlık hücresi gerçekten A16:L17'ye kayıyor, o birleşme gerçekten var, eski A18:L19
birleşmesi artık YOK, fazla talep D-100'ün appendix mekanizmasıyla güvenle taşıyor. `npm test`
1464/1464 (297 dosya), `npm run lint`/`tsc`/`build` temiz, `cargo test`/`clippy`/`fmt` temiz (Rust
dokunulmadı), `scripts/gen-a3-fixture.ts` yeniden çalıştırıldı — **sıfır fark** (fixture yalnızca
`farplas-7step-tr`'yi kullanıyor). Kapsam dışı: `pinned`, drag-handle, `farplas-7step-tr`'ye
esneklik, P-63, P-62, P-18. Tam kayıt: `DECISIONS.md` D-226. L3b'nin kendi launch prompt'u yazıldı:
`docs/oturumlar/L3b-pinned-drag-handle.md`.

**Faz 11 — L3b TAMAMEN BİTTİ (D-227, 2026-09-07) — Faz 11'in üç dilimlik planı (D-223) artık
TAMAMEN kapandı (L1+L2+L3a+L3b).** `L3b-pinned-drag-handle.md`'nin kendi §0'ı gerçek koda karşı
doğrulandı, launch prompt'un dört sorusu bir `AskUserQuestion` turuyla soruldu — dördü de Barış'ın
önerilen seçeneği: `pinned` `ProjectModel.blockPins`'te yaşayacak (`meta.` öneki yok); tek
`blockPins.set` komutu (tüm harita, D-224/D-225'in emsali); `resolveElasticBlocks` saf bir ek
parametre alıyor (`ProjectModel`'i değil); drag-handle yalnızca ekran modu, bırakınca commit.
Domain: `BlockPinsSchema = z.partialRecord(...)` (Zod'un `z.record`'ı literal-union anahtarlar
için TÜMÜNÜ zorunlu kılıyor, ölçülüp doğrulandı). Solver: eski `distributeElasticColumn` ikiye
ayrıldı — `solveGroup(members, targetTotal)` (genelleştirilmiş, pin yokken eskisiyle birebir aynı)
ve yeni `distributeElasticColumn` (her pin'i kendi floor'una VE kolektif olarak diğer üyelerin
floor'larına göre kırpıyor — floor'un altına pinlemek asla mümkün değil, 9 yeni testle
doğrulandı). UI: yeni `A3LayoutDescriptor.elasticBlocks` alanı (zaten hesaplanan geometriyi UI'ye
açan saf eklenti) + yeni `src/a3/render/gridGeometry.ts` (piksel matematiği) + iki yeni bileşen
(`BlockPinOverlay.tsx` — sürüklenebilir tutamaçlar, klavye erişilebilir; `PinnedBlockSummary.tsx`
— reset kontrolleri), ikisi de `src/a3/render/`'de (D-94'ün React/i18next istisnası).
**Barış'ın kendi ikinci `AskUserQuestion` turu** ("Drag-handle nedir?" açıklamasından sonra) —
önerilenin TERSİNİ seçti: drag-handle hem küçük panelde HEM DE büyük pop-out pencerede
(A3PreviewWindow, D-133) çalışacak, bu da A3PreviewWindow'un store'suzluğu nedeniyle yeni bir
ters-yön IPC olayı gerektirdi (`A3_PREVIEW_PIN_REQUEST_EVENT`). İki gerçek hata — pop-out'un
zoom transformunu hesaba katmayan drag matematiği (`dragScale` prop'uyla düzeltildi) ve tutamacın
pop-out'un kendi pan handler'ına sızan pointer olayları (`stopPropagation()`, mutasyon-doğrulandı)
— dışarıdan bir inceleme olmadan, kodlama sürecinin kendisinde yakalandı. `npm test` 1524/1524
(300 dosya, 1464'ten yukarı — 60 yeni test), `npm run lint`/`tsc`/`build` temiz, `cargo test`
203/203/`clippy`/`fmt` temiz (Rust dokunulmadı — yalnızca `elasticBlocks: []` ekleyen fixture
değişti). `scripts/gen-a3-fixture.ts` yeniden çalıştırıldı — tek satırlık katkısız fark. Kapsam
dışı: P-63, P-62, P-18, `farplas-7step-tr`'ye esneklik. Yeni **P-64** (bir kolonun son bloğunun
kendi tutamacı yok — solver destekliyor, yalnızca UI'nin fare-tutamacı kapsamı dar, YAGNI). Tam
kayıt: `DECISIONS.md` D-227/P-64.

**Faz 11'in üç dilimlik planı (D-223) artık TAMAMEN kapandı (L1+L2+L3a+L3b).** Sıradaki iş
Barış'ın kendi tercihine göre — örn. **W2-adim-sayfasi.md** (Workspace Yüzey Yenilemesi'nin
ikinci dilimi) — Faz 11'den bağımsız.

**Workspace Yüzey Yenilemesi — W2 TAMAMEN BİTTİ (D-228, 2026-09-08) — W1+W2 artık ikisi de
tamam, yalnızca W3 kalıyor.** `W2-adim-sayfasi.md`'nin kendi §0'ı gerçek koda karşı doğrulandı,
uyuşmadı. İki `AskUserQuestion` turu, ikisi de Barış'ın kendi seçimi: (1) yerleşim — modal
yerine **genişleyen satır (accordion)**, iki-sütun ya da sabit-bant seçenekleri değil; (2) AI
desteği — mevcut `AssistantPanel`'in RightPanel'den **tamamen taşınması**, ikinci bir panel
eklenmesi ya da yerinde bağlam-enjeksiyonu değil. Onay öncesi mockup turunda Barış **iki kez**
kararı bilerek genişletti — önce "AI sağda chatbox, A3 önizlemesi aşağıda geniş pencerede"
diyerek AI'yi tekrar ayrı bir sütuna taşıttı (ilk maket onu ana sütuna gömmüştü), sonra "sağdaki
İzlenebilirlik/İnceleme/Denetim/Çeviri sekmeleri ne işe yarıyor, hepsini kaldırıp üst şeride
düğme yapalım" diyerek **`RightPanel`'in tamamının kaldırılmasını** istedi — ikisi de ayrı
mockup revizyonlarıyla somutlaştırılıp onaylandı.
**Gerçek mimari**: `EntryEditorDialog` silindi, yerine `EntryEditorPanel` (aynı D-84
create/edit ayrımı, `DialogRoot`/`DialogContent` kabuğu yok) — `StepPage` tek bir
`ActiveEditor` slotu tutuyor (`activeEditor.ts`), `MethodBand`/`EntriesBand`'e prop olarak
akıyor, `key={activeStepId}` ile her adım değişiminde sıfırlanıyor. Yeni `AssistantColumn`
(adım sayfasının kendi sağ sütunu, `RightPanel`'in "Asistan" sekmesinin YERİNE) — otomatik bir
rehber kartı (`CoachBand`'in AYNI coaching içeriği, yeni paylaşılan `CoachingBlocks.tsx`
üzerinden, hiçbir model çağrısı yok) + `AssistantPanel` (artık store'dan `activeStepId` okumak
yerine zorunlu bir `stepId` prop'u alıyor, `activeStepId === null` guard'ı tamamen kalktı) +
her giden prompt'u bu adımın coaching içeriği + yöntem listesiyle otomatik zenginleştiren yeni
`stepAiContext.ts`. `RightPanel.tsx` TAMAMEN silindi — yerine: yeni `useA3PreviewSync.ts`
(descriptor build/push/ready-handshake/pin-forwarding, eskiden RightPanel'in içindeydi, şimdi
bağımsız bir hook), yeni `ProjectToolsBar.tsx` (`WorkspaceTopBar`'a eklendi — "A3'ü dışa aktar"
+ İzlenebilirlik her zaman görünür — AI kapalıyken bile çalışması gerektiği için — İnceleme/
Denetim/Çeviri `aiEnabled`'a bağlı, dördü de kendi GERÇEK, değişmemiş bileşenini bir dialog'da
açıyor), yeni `A3PreviewReservedBand.tsx` (adım sayfasının en altında, W3'ün gerçek kırpılmış
önizlemesi için yer tutucu + mevcut pop-out pencereyi açan bir "A3 Önizleme" düğmesi — Anasayfa'nın
kendi düğmesiyle AYNI i18n key'i, D-114'ün "aynı eylem aynı isim" ilkesi). i18n:
`workspace.rightPanel.*`'nin proje-araçlarına ait kısmı (export/traceability/review/audit/
translate) yeni `workspace.projectTools.*` ad alanına taşındı (kod-içi anahtar, görünen metin
değişmedi); `openInNewWindow`/`preview`/`assistant`/`previewStub`/`previewLoading`/
`previewError`/`assistant.noActiveStep` ölü anahtarlar olarak silindi; yeni
`workspace.assistant.columnTitle`/`guideEyebrow`, `workspace.stepPreview.*` eklendi.
`WorkspaceScreen.test.tsx`/`entryReferences.integration.test.tsx`'in kendi `dialog` sorguları
`role="group"`/`aria-label` (Girişi düzenle / New entry) sorgularına çevrildi — modal'ın
"bir seferde bir şey" disiplinini artık bir ARIA rolü değil, `StepPage`'in tek `ActiveEditor`
state'i garanti ediyor. `npm test` 1537/1537 (304 dosya, 300'den +5 yeni dosya −1 silinen
`RightPanel.test.tsx`), exit code ayrıca kontrol edildi (D-143). `npm run lint`/`npx tsc
--noEmit`/`npm run build` temiz. `cargo test`/`clippy`/`fmt` temiz — bu dilim Rust'a hiç
dokunmadı (TS/React-only, `git status src-tauri/` boş). `scripts/gen-a3-fixture.ts` yeniden
çalıştırılmadı — bu dilim `src/a3/`'de yalnızca iki yorum-satırı düzeltmesi yaptı (gerçek kod
değişmedi, diff ile doğrulandı). **Dürüst-doğrulanmamış boşluk, her zamanki sınıf**: bu
ortamda ekran/Tauri runtime yok — gerçek bir WKWebView'da accordion'un açılıp kapanması, AI
sütununun sığması, üst şeritteki dialog'ların gerçekten açılması hiç denenmedi. W3'ün kendi
launch prompt'u yazıldı: `docs/oturumlar/W3-canli-onizleme.md`.

**Workspace Yüzey Yenilemesi — W3 TAMAMEN BİTTİ (D-229, 2026-09-08) — D-217'nin üç dilimlik
planı (W1+W2+W3) ARTIK TAMAMEN KAPALI.** `W3-canli-onizleme.md`'nin kendi §0'ı doğrulandı,
tam eşleşti. §2.3'ün kendi zorunlu ölçümü kod yazılmadan ÖNCE yapıldı: geçici bir `/perf-probe`
route'u + `npx playwright` (D-136/D-113'ün "kullan, sonra sil" pratiği) ile gerçek
`buildProjectA3Layout` ölçüldü — grafiksiz proje ~0,1ms, projede herhangi bir yerde bir grafik
taşıyan tek bir kayıt (Pareto) varsa ~50-75ms, ve bu D-84'ün her tuş vuruşunda tetiklediği bir
maliyet, W3'ten bağımsız zaten var. Bu ölçümle birlikte Barış'a `AskUserQuestion` soruldu:
**seçenek (a)** — `useA3PreviewSync()` `WorkspaceShell`'de TEK kez çağrılır, `descriptorResult`
prop olarak hem `ProjectToolsBar`'a hem `A3PreviewReservedBand`'e akar — seçildi (G2, ikinci bir
çağrı grafikli bir projede tuş başına maliyeti ikiye katlardı). Ölçüm ayrıca bir debounce'un
gerekli olduğunu gösterdiği için `useA3PreviewSync.ts`'e D-84'ün değeriyle AYNI (600ms) ama
BAĞIMSIZ bir sabit taşıyan bir debounce eklendi (ilk build gecikmesiz, sonrakiler 600ms'lik
sessizlik penceresi bekliyor). §2.2 (KARARLAŞTIRILMIŞ): yeni bir renderer yok — yeni saf dosya
`src/a3/render/blockRectForStep.ts` aktif adımın blok dikdörtgenini (`descriptor.elasticBlocks`
öncelikli, yoksa şablonun statik `TemplateBlock`'u) piksel cinsinden döndürüyor,
`A3PreviewReservedBand.tsx` TAM `HtmlA3Renderer`'ı `overflow:hidden` bir konteynırda
`transform: scale() translate()` ile kırpıyor (`zoomMath.ts`'in `fitToWindowScale`'i, "asla
büyütme" kuralıyla). **Debounce'u eklerken W3'ün kendi kapsamı dışında ama engelleyici gerçek
bir yarış durumu bulundu ve düzeltildi**: `useA3PreviewSync.test.ts`'in ready-handshake testi
debounce sonrası ~%60-70 flaky hale geldi — kök neden, ready-callback'in RENDER SIRASINDA
güncellenen bir ref okurken, `pushDescriptorToPreviewWindow`'un build'in `.then()`'i içinde bu
ref'in React flush'ından ÖNCE senkron çağrılması. Yeni bir `latestOkDescriptor` ref'i,
`pushDescriptorToPreviewWindow` ile TAM AYNI senkron blokta güncellenerek düzeltildi — 8/8 art
arda temiz koşuyla doğrulandı. `npm test` 1549/1549 (306 dosya, 304'ten — +12 net test), iki
ayrı tam-paket koşuda exit code 0 doğrulandı. `npm run lint`/`npx tsc --noEmit`/`npm run build`
temiz. `cargo test`/`clippy`/`fmt` temiz — Rust bu dilimde HİÇ değişmedi. `scripts/gen-a3-
fixture.ts` yeniden çalıştırılmadı — bu dilim yalnızca yeni bir saf dosya ekledi ve mevcut UI
bileşenlerinde prop-threading yaptı. Tam kayıt: `DECISIONS.md` D-229.

## Prompt yazarken

- **Her dosya adını depoda doğrula.** Promptun ilk adımı, adlandırdığı dosyaların
  varlığını kontrol ettirmek olmalı — eskimiş bir prompt sessizce başarısız olur.
- **Kapsam dışını say.** Hangi LOCKED kararlara dokunulmayacağı yazılmazsa açılır.
- **Açık soruları başa al.** Cevap gelmeden yazılan tasarım yeniden yapılır.
- **Bütçeyi tahmin ettir ve bölmeyi yetkilendir** (Madde 1 / G1).
