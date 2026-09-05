# FAZ 10 — Kapsam belirleme (kod YAZILMAZ, yalnızca ölçüm + dilim planı)

> Faz 9 (J1/J2/J3, J3'ün kendisi yedi alt-dilim J3-1..J3-7) 2026-09-05'te TAMAMEN kapandı
> (D-204 üzerinden D-212). `SPEC.md` §6'nın kendi faz tablosu sırada **Faz 10**'u gösteriyor:
> "**AI review & layout**: A3 placement optimizer, condensation to cell budget, mock-auditor
> review, TR↔EN translation, cost meter — Done when: Assistant rewrites an overflowing A3
> into budget without losing meaning, and flags a weak root cause on a deliberately-bad
> project."
>
> Bu **`faz8-kapsam-belirleme.md`/`faz9-kapsam-belirleme.md`'nin aynı emsali**: ölçüm + karar,
> kod yok. Faz 9, registry'nin 50 method'unun her birine "önerilen bir taslak üret, insan kabul
> etsin" akışını verdi (`EntryProposalField`, `complete_structured`, prompt kütüphanesi) — bu
> fazın işi FARKLI bir eksen: zaten yazılmış bir A3'ün **kendisini** gözden geçirmek
> (yerleşim, bütçeye sığdırma, dil, tutarlılık, maliyet), tek bir method'un payload'ını değil.
> Faz 9'un `EntryProposalField`/`proposeStructuredEntry` mekanizması burada muhtemelen
> DOĞRUDAN yeniden kullanılamaz — girdi tek bir method'un şeması değil, tüm
> `A3LayoutDescriptor` + `ProjectModel`.
>
> **SPEC.md §8'in kendi metni bu fazın beş alt-parçasını TEK cümlede sıralıyor ama olgunluk
> açısından birbirinden çok farklı** — tıpkı Faz 9'un kendi beş alt-teslimatının farklı
> olgunlukta olması gibi (D-203'ün kendi bulgusu). Bu oturumun işi önce ölçmek: hangi parça
> zaten var olan bir mekanizmanın (`evaluateReadiness`, D-196; `EntryProposalField`, D-204)
> üzerine küçük bir katman, hangisi GERÇEKTEN yeni bir mekanizma.
>
> Kanonik konum: `docs/oturumlar/faz10-kapsam-belirleme.md`. Yazıldı: 2026-09-05, Faz 9'un
> (J3-7 ile) kapanışının hemen ardından, Barış'ın isteğiyle ("sıradaki oturum için prompt
> paylaşır mısın").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      src/a3/methodContract.ts \
      src/a3/buildA3Layout.ts \
      src/a3/layout/budget.ts \
      src/domain/readiness/evaluateReadiness.ts \
      src-tauri/src/ai/provider.rs \
      src/ai/prompts/library.ts \
      src/app/routes/workspace/AssistantPanel.tsx \
      src/app/routes/workspace/EntryProposalField.tsx \
      src/app/routes/workspace/RightPanel.tsx
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle**. Ayrıca şunu da doğrula — bu listenin
**hâlâ doğru olması** bekleniyor (2026-09-05'te doğrulandı; değişmişse önce `DECISIONS.md`'ye
bak, birisi bu boşluğu zaten kapatmış olabilir):

```bash
grep -n "fn list_models\|fn test_connection\|fn complete\|fn cancel\|fn complete_structured\|fn capabilities" src-tauri/src/ai/provider.rs
  # ALTISI DA VAR bekleniyor — Faz 8/9 hepsini kurdu

grep -rln "placement optimizer\|PlacementOptimizer\|condens" src src-tauri/src
grep -rln "translate\|Translation" src/ai src-tauri/src/ai
grep -rln "mock.auditor\|mockAuditor\|CostMeter\|ai-log.jsonl\|spendCap\|spend cap" src src-tauri/src
  # HİÇBİRİ BULUNMAMALI — Faz 10'un TAMAMI henüz sıfır kod

grep -rn "^mode: " src/ai/prompts/*/*.md | sed -E 's/^([^:]+):[0-9]+:mode: (.*)$/\2/' | sort -u
  # yalnızca "draft" bekleniyor (51 dosyada) — Faz 9'un TAMAMI draft modu, Critique/Extract/
  # Review modları (§8.6) hiç yok

grep -n "editDistance" DECISIONS.md | grep "P-47"
  # P-47 satırı artık CLOSED olmalı (D-204, bu oturumdan önce düzeltildi) — hâlâ açık
  # görünüyorsa DECISIONS.md'yi gerçek koda karşı yeniden doğrula, körü körüne güvenme
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md`. **`AKIS.md`'yi bu oturum okumana gerek YOK** — bu oturum kod
   yazmıyor, yalnızca okuyor ve `docs/`/`DECISIONS.md`'ye yazıyor (istisna: Barış aynı
   oturumda küçük bir dilimi kodlamanı isterse, o noktada dur ve `AKIS.md`'yi oku).
2. `SPEC.md` §8'in **tamamı** — Faz 8/9 kapsam belirlemelerinin zaten okuduğun ilkeler dışında
   bu sefer özellikle şu alt bölümlere odaklanarak:
   - §8.6'nın kendi tablo-altı cümlesi — "Cross-cutting: **A3 layout optimization** (§8.10),
     **TR↔EN translation** of any field or the whole report, and **final review** — a pass
     over the finished A3 in the voice of a customer quality auditor, listing what would be
     questioned." Bu ÜÇ cümle, bu fazın kendi beş kelimesinin ("A3 placement optimizer",
     "mock-auditor review", "TR↔EN translation") gerçek kaynağı — §8.6'nın dört modundan
     ("Critique/Draft/Extract/**Review**") **Review** modu muhtemelen mock-auditor
     incelemesinin karşılığı, ama hiç uygulanmadı (D-201 yalnızca çıplak sohbet kutusu verdi,
     Faz 9'un tamamı yalnızca `mode: draft` kullandı — §0'da doğruladın).
   - §8.10 — A3 placement optimizer'ın kendi dört maddesi (primary/appendix kararı, bütçeye
     koşullandırma, hangi chart'ın öne çıkacağı, anlatı kopukluklarını yakalama). **4. madde
     ("a countermeasure with no root cause above it, a target that no result addresses, a
     step 8 that standardizes something step 6 never implemented") `evaluateReadiness.ts`'in
     (D-196, Faz 7 G1) SEKİZ S1-S8 kuralıyla ÇAKIŞIYOR OLABİLİR** — bu oturumun kendi
     tespiti: bu fazın "flags the narrative breaks" işi `evaluateReadiness`'in üzerine mi
     inşa ediliyor, yoksa tamamen ayrı, AI-özel bir ikinci kontrol mü? İkisinin aynı bulguyu
     iki farklı yerde iki farklı şekilde raporlaması G2'nin (tekrar) kendi ihlali olur.
   - §8.11 — redaction. `RedactionPolicySchema` hâlâ yalnızca `off`/`customers` destekliyor
     (J2/D-205'in kendi scope-narrowing kararı) — `customers-and-parts`/`custom` modları
     `SPEC.md`'nin kendi taslağında var ama hiç yapılmadı. Bu fazın kapsamı mı, yoksa hâlâ
     kendi P-numarasını mı bekliyor?
   - §8.12 — maliyet sayacı. Bugün SIFIR: `CompletionMeta`'da token sayısı yok (Vorion'un
     Streaming Prediction'ının kendi gerçek şekli, D-201 — SSE yanıtında hiç token count
     alanı yok), `ai-log.jsonl` hiç yazılmıyor, `Settings`'te "Monthly spend cap" yok. Bu,
     §8.2'nin `cost_per_mtok` alanının da (Rust `Capabilities` struct'ında bugün YOK, yalnızca
     `json_schema` var, D-204) hiç doldurulmadığı anlamına geliyor — model başına gerçek
     fiyatlandırma verisi nereden gelecek? Vorion'un kendi dokümantasyonu bunu veriyor mu,
     yoksa elle bakılan bir sabit config mi olacak?
   - §8.13 — provenance. `editDistance` ARTIK KAPALI (P-47, D-204) — bu fazın kendi işi değil,
     yalnızca teyit et. "Include AI provenance appendix" Settings anahtarı hiç yok — bu fazın
     mı, yoksa ayrı bir P-numarasının mı konusu?
   - §8.14 — hata modları. Çoğu zaten Faz 8/9'da ele alındı (key yok/geçersiz, rate limit,
     network offline, context window aşımı, stream kesintisi) — bu faz için özellikle
     "provider confidently wrong structured data" maddesi ilgili: mock-auditor review'ın
     kendisi de yapılandırılmış bir öneri döndürüyorsa (bulgular listesi), Faz 9'un zaten
     kurduğu Zod-doğrulama + retry-once deseni (`proposeStructuredEntry`) burada da
     tekrarlanabilir mi, yoksa yeni bir mekanizma mı gerekiyor?
3. `SPEC.md` §6'nın kendi faz tablosu — Faz 9/10/11 sınırı: **Faz 9** (kapandı) = structured
   generation + proposal akışı + içeri alma + redaction, TEK method/entry seviyesinde. **Faz
   10** (bu oturum) = TÜM A3'e bakan ikinci-geçiş inceleme + optimizasyon + çeviri + maliyet.
   **Faz 11** = kalan template'ler, template switching — bu fazın konusu DEĞİL, karıştırma.
   "Phases 8–10 are additive" — Faz 0-9'un hiçbiri bozulmaz, D-20'nin E2E suite'i
   (`e2e/`) YEŞİL kalmalı.
4. `CLAUDE.md`'nin "Decisions already made → AI layer" bölümü + "Current state"in Faz 9 özeti
   (D-204 üzerinden D-212) — özellikle J1/J3-x'in "deliberately not built" notları (P-48
   Resume Stream, P-50 `contextSlices` hâlâ tüketilmiyor, P-51 redaction yalnızca
   `complete_structured`'a bağlı, P-52 yalnızca ilk xlsx sayfası) — bu fazın sınırına yakın
   duran gerçek boşluklar, hiçbiri bu fazın kendi done-koşuluna dahil değil ama unutma.
5. `DECISIONS.md` D-199 (tek-sağlayıcı Vorion mimarisi, LOCKED), D-204 (J1 — `capabilities()`
   json_schema:false bulgusu, yani Vorion'da yapılandırılmış çıktı tamamen prompt
   mühendisliği — bu fazın "mock-auditor review" ve "TR↔EN translation" çıktıları da aynı
   yoldan, ayrı bir Vorion endpoint'i YOK), D-196 (G1 — sekiz S1-S8 readiness kuralı, madde
   2'nin kendi çakışma sorusu için oku), D-207 (D-211'e kadar, J3'ün her diliminin "sıfır yeni
   mimari karar" deseni — bu fazın muhtemelen TERSİ, çünkü placement optimizer/translation/
   cost meter üçü de gerçekten yeni mekanizma).
6. Kendi taramanı yap (körü körüne bu listeye güvenme — D-137'nin kendi dersi, Faz 8/9 kapsam
   belirlemelerinin de uyguladığı). §0'daki komutları çalıştır, tabloyu kendi bulgularınla
   doğrula/güncelle.

---

## 2. Bu oturumun işi

**Kod YAZMA.** Bu oturumun tek çıktısı: (1) yukarıdaki ön taramayı gerçek koda karşı bir kez
daha doğrulanmış hale getirmek, (2) `docs/oturumlar/README.md`'ye benzer bir **Faz 10 dilim
tablosu** önerisi (D-114'ün "dilim başına bir yeni mekanizma" bütçesini uygula — bu fazda
muhtemelen üç-dört gerçek yeni mekanizma var, J3'ün "50 method, sıfır yeni mekanizma"
deseninin tam tersi), (3) gerçek açık tasarım sorularını `AskUserQuestion` ile Barış'a sormak.

### 2.1 Muhtemel gerçek açık sorular (kesin değil — dosyaları okuduktan sonra doğrula)

1. **A3 placement optimizer'ın girdi/çıktı şekli ne?** §8.10 "returns a *diff* against the
   current layout, previewed side by side, applied only on Accept" diyor — bu, Faz 9'un
   `EntryProposalField`'ından (tek method payload'ı) yapısal olarak farklı bir UI: tüm
   `A3LayoutDescriptor`'ı (veya `ProjectModel`'i) girdi alıp bir DEĞİŞİKLİK KÜMESİ (hangi
   entry primary↔appendix taşınıyor, hangi metin kısaltılıyor) döndüren yeni bir proposal
   türü. Bu, `EntryProposalField`'ın genelleştirilmesi mi, yoksa paralel yeni bir bileşen mi
   (`A3ReviewPanel` gibi)?
2. **"Condensation to cell budget" gerçek neyi kısaltıyor?** §8.10 madde 2 "numbers, dates,
   part numbers and owners are protected tokens that may never be dropped or rounded" diyor —
   bu, serbest metin alanları (örn. `gapStatement.gap`, `lessonsLearned.wentWell`) için bir
   YENİDEN-YAZMA öneri akışı mı? Zod şemasına bağlı `complete_structured` mi kullanılacak
   (aynı alan sayısı, daha kısa metin), yoksa serbest metin `complete()` mi (Faz 8'in
   streaming chat mekanizması)?
3. **Mock-auditor review'ın çıktı şekli ne — yapılandırılmış bir bulgu listesi mi, serbest
   metin bir rapor mu?** §8.6 "listing what would be questioned" diyor — bir liste, ama her
   öğe hangi step/entry'ye mi bağlanıyor (D-196'nın `evaluateReadiness` bulgularının aynı
   şekli — `{stepId, ruleId, message}` gibi) yoksa serbest metin bir paragraf mı? Eğer
   yapısal olacaksa, `evaluateReadiness`'in SEKİZ kuralıyla (S1-S8, D-196) bu yeni AI-bulgu
   listesi nasıl bir arada gösteriliyor — aynı `ReadinessAdvisory` bileşeni mi genişliyor,
   yoksa ayrı bir bölüm mü?
4. **TR↔EN çeviri neyi çeviriyor — tek bir alanı mı, tüm raporu mu, ikisi de mi?** §8.6 "of
   any field or the whole report" diyor. Tek alan çevirisi UI'da nerede tetiklenir (her
   `EntryEditorDialog`'a bir "Translate" düğmesi mi)? Tüm rapor çevirisi `project.meta.
   language`'ı DEĞİŞTİRİYOR mu (D-188/P-26'nın export-language mekanizmasıyla nasıl
   ilişkileniyor — `resolveA3Language` zaten var, bu yalnızca YENİ bir dilde YENİ entry
   metinleri mi üretiyor, yoksa var olan `A3Language`'ı mı kullanıyor)?
5. **Cost meter'ın veri kaynağı ne — Vorion gerçekten token/maliyet bilgisi veriyor mu?**
   D-201'in kendi bulgusu: Streaming Prediction'ın SSE yanıtında hiç token count alanı yok.
   Synchronous Prediction'ın (`complete_structured`'ın kendi temeli) yanıtı token count
   veriyor muydu (D-200/D-201'i kontrol et — eğer öyleyse Faz 10'un cost meter'ı yalnızca
   `complete_structured` çağrılarını sayabilir, streaming chat'i (Faz 8, `AssistantPanel`)
   sayamaz, bu bir gerçek kapsam sınırı). **Bu, kodlamadan önce Barış'ın kendi yetkili
   `vorionai.com/docs` oturumundan doğrulanmalı olabilir** — D-199/D-200/D-201/D-204'ün aynı
   disiplini (ekran görüntüsü, tahmin yok) — ama önce mevcut ekran görüntülerinde/dokümanda
   zaten cevaplanmış mı diye D-200/D-201'i dikkatlice yeniden oku, gereksiz ikinci bir
   Barış turu istemeden önce.
6. **Bu fazın "deliberately-bad project" test senaryosu nasıl inşa ediliyor?** Done-koşulu
   "flags a weak root cause on a deliberately-bad project" diyor — bu, elle yazılmış bir
   fixture `.ppsx` mi (D-62'nin fixture-corpus emsali), yoksa canlı bir demo mu? Bu fazın
   kendi kabul testi neye bakacak, kim/nasıl doğrulayacak?
7. **Dilim sayısı ve sırası.** Muhtemel aday bölünme (Barış'a önerilecek, kesin değil —
   D-114'ün "dilim başına bir yeni mekanizma" bütçesi burada muhtemelen 3-4 dilim gerektirir,
   Faz 9'un "50 method / sıfır yeni mekanizma" deseninin tam tersi):
   - **K1** — A3 placement optimizer + condensation (bütçeye sığdırma), tek yeni proposal
     mekanizması + diff-preview UI.
   - **K2** — Mock-auditor review modu, muhtemelen `evaluateReadiness`'in üzerine ikinci bir
     AI-katmanı.
   - **K3** — TR↔EN çeviri.
   - **K4** — Cost meter + `ai-log.jsonl` + Settings'teki spend cap.
   - Bu sıralama kesin değil — bu oturumun kendi işi doğru sırayı ve sınırları bulmak; iki
     küçük parça (örn. K3+K4) birleştirilebilir, J3-3'ün Adım 3+4 birleşme emsali gibi.

### 2.2 Kapsam dışı (bu oturumda kesinlikle karara BAĞLANMAZ)

- Faz 11'in kendi işi: kalan template'ler (`farplas-7step-plus`/`-en`/`pps-8step-auto`),
  template switching, `BenefitCase`/`Onay formu` — bu fazın konusu değil.
- D-13→D-21, D-199, D-203 ve Faz 9'un LOCKED kararlarının yeniden tartışılması — bu oturum
  onları uygular, sorgulamaz.
- `RedactionPolicySchema`'nın `customers-and-parts`/`custom` modlarının gerçek uygulanması —
  bu fazın kapsamına girip girmediği bir açık soru (madde 2.1.4'e benzer), ama KARARLAŞTIRMA
  bu oturumda olabilir, UYGULAMA olmaz.
- Herhangi bir gerçek Vorion çağrısının kodlanması — bu oturum yalnızca dokümana karşı
  doğrulanmış soruyu çıkarır, gerçek entegrasyon K1/K2/K3/K4'ün (veya nihai isimleriyle her
  ne olacaklarsa) işi.
- P-48/P-50/P-51/P-52'nin kapatılması — bu oturumun konusu değil, yalnızca not düşülür.

---

## 3. Bütçe ve kapanış disiplini

Açılışta kaba bir tahmin ver (Anayasa Madde 1). Bu bir **ölçüm** oturumu — `faz8-kapsam-
belirleme.md`/`faz9-kapsam-belirleme.md` ile kıyaslanabilir olmalı (tek oturumda biter, kod
yok) — ama madde 5'in kendi sorusu (Vorion'un maliyet/token verisi) gerçek doküman taraması
gerektirebilir; bu hâlâ "ölçüm" kapsamında (Barış'ın ekran görüntüsü paylaşması gerekebilir)
ama Faz 8/9'un kendi implementasyon dilimlerinin derinliğine kaymamalı — yalnızca soru
netleşsin, gerçek kod K1/K2/K3/K4'ün işi.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bu oturumun kendi bulgu ve dilim planı),
`docs/oturumlar/README.md`'ye Faz 10'un kendi dilim tablosu (Faz 8/9'un kendi bölümlerine
benzer yeni bir bölüm), `CLAUDE.md`'nin "Current state"ine "Phase: 10 of 12 — kapsam
belirlendi, henüz inşa edilmedi" türü bir güncelleme. Kod yok, ama docs değişikliği yine de
commit'lenmeli (yalnızca docs dokunduğu için düşük riskli — `AKIS.md`'nin kalıcı commit
yetkisi burada da geçerli).

---

**Model önerisi:** Bu oturum kısmen Opus-değerlendirilebilir — Faz 9'un "sıfır yeni mimari
karar, saf tekrar" dilimlerinin aksine, bu faz muhtemelen 3-4 GERÇEK yeni mekanizma (placement
diff akışı, mock-auditor'ın veri şekli, çeviri tetikleyicisi, cost meter'ın veri kaynağı)
gerektiriyor — D-28'in kendi routing ilkesi ("architectural decisions → Opus") burada devreye
girebilir. Ama bu oturumun KENDİSİ yalnızca ölçüm/soru-çıkarma; Sonnet 5 bu oturum için
yeterli, mimari kararın kendisi (K1/K2/K3/K4'ün her biri kodlanırken) Opus'a yönlendirilebilir.
