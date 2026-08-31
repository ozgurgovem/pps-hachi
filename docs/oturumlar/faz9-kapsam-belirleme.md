# FAZ 9 — Kapsam belirleme (kod YAZILMAZ, yalnızca ölçüm + dilim planı)

> Faz 8 (Dilim 1/2/3 — D-200/D-201/D-202) 2026-08-31'de tamamen kapandı. `SPEC.md` §6'nın
> kendi faz tablosu sırada **Faz 9**'u gösteriyor: "**AI structured generation**:
> `generateStructured` per provider, per-step prompt library, proposal→accept/edit/reject
> flow, file & image ingestion, redaction layer — Done when: the assistant can propose a
> valid Pareto entry from an uploaded xlsx and the user can accept it into the project with
> correct provenance."
>
> Bu **`faz8-kapsam-belirleme.md`'nin aynı emsali**: ölçüm + karar, kod yok. Beş ayrı
> alt-teslimat (structured generation, prompt library, proposal akışı, dosya/görsel içeri
> alma, redaction) tek cümlede sıralanmış ama olgunluk açısından birbirinden çok farklı —
> Faz 8 zaten bir `LlmProvider` trait'i, gerçek Vorion `list_models`/`test_connection`/
> `complete`/`cancel`'ı, çıplak bir streaming chat kutusunu ve provenance plumbing'in
> BİR KISMINI verdi; bu fazın işi bunun üzerine **yapılandırılmış** (schema'ya bağlı,
> method-plugin'e bağlı) bir üretim/kabul akışı inşa etmek.
>
> **`SPEC.md` §8'in kendi metni hâlâ Gün-1'in üç-sağlayıcı (Anthropic/OpenAI/Google)
> varsayımıyla yazılmış** — D-199 (2026-08-30) bunu kısmen geçersiz kıldı: gerçek dağıtım
> tek sağlayıcı, Vorion. §8.2'nin üç-sütunlu adaptör tablosu artık konu dışı; bu oturum
> §8'i okurken HER YERDE "provider" yerine "Vorion" okumalı, üç-sağlayıcı karşılaştırmasını
> değil D-199/D-200/D-201'in zaten doğruladığı gerçek Vorion şeklini esas almalı. **D-199'un
> kendi, o zaman bilerek çözülmemiş bıraktığı soru bu fazın tam kalbi**: "`complete_structured()`'ın
> Vorion'daki karşılığı — ayrı bir endpoint mi, yoksa Prediction isteğinde bir
> `response_format`/schema parametresi mi — görülmedi." Bu, kodlamadan önce Barış'ın kendi
> yetkili `vorionai.com/docs` oturumundan doğrulanması gereken İLK şey.
>
> Kanonik konum: `docs/oturumlar/faz9-kapsam-belirleme.md`. Yazıldı: 2026-08-31, Faz 8'in
> kapanışının hemen ardından, Barış'ın isteğiyle ("yeni oturum için prompt paylaşır mısın").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      src-tauri/src/ai/provider.rs \
      src-tauri/src/ai/vorion.rs \
      src/ai/completionIpc.ts \
      src/ai/proposal/.gitkeep \
      src/app/routes/workspace/AssistantPanel.tsx \
      src/domain/model/projectModel.ts \
      src/methods/chartSpec.ts \
      e2e/wdio.conf.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle**. Ayrıca şunu da doğrula — bu
listenin **hâlâ doğru olması** bekleniyor (2026-08-31'de doğrulandı; değişmişse önce
`DECISIONS.md`'ye bak, birisi bu boşluğu zaten kapatmış olabilir):

```bash
grep -n "RedactionPolicySchema" src/domain/model/projectModel.ts   # z.looseObject({}) BEKLENİYOR — hâlâ boş
grep -rn "complete_structured\|generateStructured\|StructuredRequest" src src-tauri/src   # BOŞ BEKLENİYOR
grep -n "fn list_models\|fn test_connection\|fn complete\|fn cancel\|fn capabilities" src-tauri/src/ai/provider.rs
  # ilk dördü VAR, capabilities YOK bekleniyor
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md`. **`AKIS.md`'yi bu oturum okumana gerek YOK** — bu oturum kod
   yazmıyor, yalnızca okuyor ve `docs/`/`DECISIONS.md`'ye yazıyor (istisna: Barış aynı
   oturumda küçük bir dilimi kodlamanı isterse, o noktada dur ve `AKIS.md`'yi oku).
2. `SPEC.md` §8'in **tamamı**, Faz 8 kapsam-belirlemesinin zaten okuduğun ilkeler dışında
   bu sefer özellikle şu alt bölümlere odaklanarak (üç-sağlayıcı varsayımını Vorion'a
   zihinsel olarak çevirerek):
   - §8.2 — `complete_structured`/`capabilities()` taslağı. Rust tarafında bugün ne var,
     ne yok (§0'da doğruladın) — bu ikisi bu fazın `LlmProvider` trait'ine eklenecek gerçek
     yüzey.
   - §8.6 — dört mod (Critique/Draft/Extract/Review). D-201'in çıplak sohbet kutusu
     hiçbirini uygulamıyor (yalnızca serbest metin) — bu fazın "proposal" akışı bunlardan
     en az birini (muhtemelen Draft, done-koşulunun "propose a valid Pareto entry"i
     doğrudan işaret ediyor) gerçek yapmalı mı?
   - §8.7 — per-step prompt library + `promptVersion`. D-201'in `"bare-chat-v1"` sabiti
     bunun yerine geçiyordu, bilerek "gerçek bir versiyonlanmış prompt dosyası yok" diye
     kayıtlı (D-201). Bu fazın işi tam olarak bunu gerçek yapmak.
   - §8.8 — "the model emits specs, not pictures." `src/methods/chartSpec.ts`'in
     `ChartSpec` union'ı (Pareto/Trend/Trajectory/Histogram/Scatter/BoxPlot/KpiStrip,
     Faz 5/6c/C3'te inşa edildi) muhtemelen bu fazın "yapılandırılmış çıktı" hedefi —
     modelin YENİDEN bir chart-şeması icat etmesi değil, zaten var olan bu union'a
     uyması gerekiyor. Yeniden icat riski var mı, yoksa doğrudan yeniden kullanılabilir mi
     — bu oturumun kendi tespiti.
   - §8.9 — dosya/görsel içeri alma. **D-118/D-193/6e-1/6e-2'nin inşa ettiği görsel
     içeri alma (kullanıcı bir fotoğraf yükler, EXIF silinir, küçültülür, bir entry'ye
     eklenir) BU DEĞİL** — o, insanın kendi eliyle bir method'a fotoğraf eklemesi. §8.9
     "kullanıcı gerçek bir üretim veri tablosu yükler, asistan onu okur" diyor — modele
     giden tarafta hiç mekanizma yok. `CLAUDE.md`'nin kendi uyarısını oku: "Sending a
     whole 50,000-row spreadsheet to a model. Summarize and sample in Rust first, and
     show the user what is actually being transmitted" — bu, Rust tarafında YENİ bir alt
     sistem (xlsx okuma/örnekleme), henüz hiç yok.
   - §8.11 — redaction. `RedactionPolicySchema` hâlâ boş (§0'da doğruladın). Faz 8 kapsam
     belirlemesi bunu "Faz 8'de mi genişletilecek" diye sormuştu ama hiç genişletilmedi —
     şimdi bu fazın önünde duruyor.
   - §8.12-8.14 — maliyet sayacı (Faz 10'un işi olarak zaten işaretli, D-201), provenance/
     `editDistance` (P-47, hâlâ açık — bu fazın "gerçek accept/edit/reject" akışı bunu
     doğal olarak gerektirebilir, kontrol et), hata/kesinti (Cancel zaten var, Resume
     Stream P-48 hâlâ açık, bu fazın kapsamı değil muhtemelen ama teyit et).
3. `SPEC.md` §6'nın kendi faz tablosu — Faz 9/10 ayrımı: **Faz 9** (bu oturum) = structured
   generation + proposal akışı + içeri alma + redaction; **Faz 10** = A3 yerleştirme
   optimizeri, koşullandırma, sahte-denetçi incelemesi, TR↔EN çeviri, maliyet sayacı.
   "Phases 8–10 are additive" — Faz 0-8'in hiçbiri bozulmaz, D-20'nin yeni E2E suite'i
   (`e2e/`, D-202) YEŞİL kalmalı.
4. `CLAUDE.md`'nin "Decisions already made → AI layer" bölümü + "Current state"in Faz 8
   üç-dilim özeti (D-200/D-201/D-202) — özellikle D-201'in "Deliberately not built:
   `editDistance` (P-47), §8.5's real New Project AI step" notları, bu fazın sınırına
   yakın duran gerçek boşluklar.
5. `DECISIONS.md` D-199 (tek-sağlayıcı Vorion mimarisi + D-15/D-16 Agent/RAG/Marketplace
   sınırı — bu fazda da geçerli, LOCKED), D-200/D-201/D-202 (Faz 8'in üç dilimi, ne inşa
   edildiğinin birebir kaydı), P-47 (`editDistance`), P-48 (Resume Stream), P-49 (E2E
   mock'un gerçek UI çağrılarını yakalayıp yakalamadığı — bu fazın konusu değil ama hâlâ
   açık, unutma).
6. Kendi taramanı yap (körü körüne bu listeye güvenme — D-137'nin kendi dersi, Faz 8 kapsam
   belirlemesinin de uyguladığı). §0'daki komutları çalıştır, tabloyu kendi bulgularınla
   doğrula/güncelle.

---

## 2. Bu oturumun işi

**Kod YAZMA.** Bu oturumun tek çıktısı: (1) yukarıdaki ön taramayı gerçek koda karşı bir kez
daha doğrulanmış hale getirmek, (2) `docs/oturumlar/README.md`'ye benzer bir **Faz 9 dilim
tablosu** önerisi (D-114'ün "dilim başına bir yeni mekanizma" bütçesini uygula), (3) gerçek
açık tasarım sorularını `AskUserQuestion` ile Barış'a sormak.

### 2.1 Muhtemel gerçek açık sorular (kesin değil — dosyaları okuduktan sonra doğrula)

1. **Vorion'da yapılandırılmış çıktının gerçek şekli ne?** D-199'un kendi bilerek
   çözülmemiş bıraktığı soru. Vorion'un Prediction ailesi (Synchronous/Streaming) bugüne
   kadar görülen şekliyle yalnızca `prompt.text` alıyor — ayrı bir "structured output"/
   "tool use"/`response_format` parametresi hiç görülmedi. Gerçek olasılıklar: (a) Vorion'un
   böyle bir parametresi var ama D-199/200/201'in taramaları onu hiç kapsamadı (LLM
   Configuration/Predictions dışında bir alt menü olabilir), (b) hiç yok — yapılandırılmış
   çıktı yalnızca prompt mühendisliğiyle (modele "yalnızca şu JSON şemasına uyan bir yanıt
   ver" denip Rust tarafında `serde_json`+Zod-türetilmiş şema ile ayrıştırılıp
   doğrulanarak) elde edilecek. **Bu, kodlamadan önce Barış'ın kendi yetkili
   `vorionai.com/docs` oturumundan doğrulanmalı** — D-200/D-201'in aynı disiplini
   (ekran görüntüsü, tahmin yok).
2. **Per-step prompt library nerede yaşıyor, nasıl versiyonlanıyor?** `src/content/
   coaching/{tr,en}/step-N.md`'nin (Faz 3) aynı deseni mi (yeni bir `src/ai/prompts/`
   dizini, method-id'ye göre dosyalar), yoksa method plugin'in kendi içine mi gömülüyor
   (`MethodPlugin.promptTemplate?` gibi yeni bir alan)? `promptVersion` gerçek bir sürüm
   numarası/hash mi olacak, yoksa dosya adının kendisi mi (`"pareto-draft-v1"` gibi)?
3. **İlk dilim hangi TEK method'u hedefliyor?** Done-koşulu açıkça Pareto'yu adlandırıyor
   ("propose a valid Pareto entry from an uploaded xlsx"). Faz 8'in H2 emsaline benzer
   şekilde — tüm method registry'sini (29 plugin) aynı anda yapılandırılmış-üretime açmak
   yerine, ÖNCE Pareto (veya başka tek bir referans method) uçtan uca (dosya içeri alma →
   örnekleme → prompt → Vorion'dan yapılandırılmış yanıt → Zod doğrulama → proposal UI →
   accept → `Entry` olarak yazma, doğru provenance'la) çalışsın, kalan method'lar sonraki
   dilimde mi genelleştirilsin?
4. **Dosya içeri alma (§8.9) bu fazın kendi ilk dilimi mi, ayrı bir alt sistem mi?**
   `CLAUDE.md`'nin "özetle ve örnekle, kullanıcıya ne gönderildiğini göster" kuralı gerçek
   bir Rust xlsx-okuma+örnekleme mekanizması gerektiriyor — bu, D-114'ün "dilim başına tek
   yeni mekanizma" bütçesini tek başına doldurabilir. Proposal akışının kendisinden (madde
   3) ayrı bir dilim mi?
5. **Redaction (§8.11) bu fazda mı genişletiliyor, yoksa yine ertelenip yeni bir P-numarası
   mı alıyor?** `RedactionPolicySchema` hâlâ tamamen boş. Vorion'a giden HERHANGİ bir veri
   (dosya örneklemesi, adım bağlamı) varsa redaction'ın en azından temel bir hâli (PII/parça
   numarası maskeleme gibi) bu fazın "kullanıcının verisi kullanıcınındır" ilkesiyle
   (§8.1, LOCKED) doğrudan çakışabilir — bu oturumun kendi kararı, ertelemek riskli mi
   değerlendirilmeli.
6. **Mevcut çıplak `AssistantPanel` sohbeti bu akışla nasıl ilişkileniyor?** Yeni,
   şema-farkında bir "Propose [Method]" akışı `AssistantPanel`'in İÇİNE mi entegre
   oluyor (adım-bağlamı algılayan tek bir sohbet), yoksa her method kartının kendi
   "Assistant'a sor" düğmesi gibi PARALEL, ayrı bir yüzey mi (D-125'in generic-shell
   `EntryReferenceField`/`EntryImagesField` emsaline benzer bir `EntryProposalField`)?
7. **Dilim sayısı ve sırası.** Muhtemel aday bölünme (Barış'a önerilecek, kesin değil):
   - **J1** — Vorion'un yapılandırılmış-çıktı şeklinin doğrulanması + `LlmProvider`'a
     `complete_structured`/`capabilities()` eklenmesi + TEK bir referans method (Pareto)
     için uçtan uca proposal akışı (dosya içeri alma HARİÇ — elle girilmiş/yapıştırılmış
     veriyle).
   - **J2** — Dosya içeri alma (xlsx okuma + Rust'ta örnekleme + "işte gönderilecek olan
     bu" önizlemesi) + J1'in akışına bağlanması.
   - **J3** — Redaction'ın gerçek uygulanması (`RedactionPolicySchema` gerçek alanlar +
     bir uygulama katmanı, muhtemelen J2'nin örnekleme adımına takılı).
   - **J4** — Per-step prompt library'nin geri kalan method'lara genelleştirilmesi
     (registry'deki uygun her method için).
   - Bu sıralama kesin değil — bu oturumun kendi işi doğru sırayı ve sınırları bulmak.

### 2.2 Kapsam dışı (bu oturumda kesinlikle karara BAĞLANMAZ)

- Faz 10'un kendi işi: A3 yerleştirme optimizeri (§8.10), koşullandırma, sahte-denetçi
  incelemesi, TR↔EN çeviri, maliyet sayacı (§8.12).
- D-13→D-21 ve D-199'un yeniden tartışılması — hepsi LOCKED, bu oturum onları uygular,
  sorgulamaz. Özellikle D-15/D-16'nın Agent/RAG/Marketplace sınırı — dosya içeri alma
  (§8.9) Vorion'un RAG Service'ini ÇAĞIRMAZ, yalnızca LLM Service'in Prediction'ına
  gömülü bağlam olarak gönderir.
- Herhangi bir gerçek Vorion yapılandırılmış-çıktı çağrısının kodlanması — bu oturum
  yalnızca dokümana karşı doğrulanmış soruyu çıkarır, gerçek entegrasyon J1'in işi.
- P-47/P-48/P-49'un kapatılması — bu oturumun konusu değil, yalnızca not düşülür.

---

## 3. Bütçe ve kapanış disiplini

Açılışta kaba bir tahmin ver (Anayasa Madde 1). Bu bir **ölçüm** oturumu — `faz8-kapsam-
belirleme.md` ile kıyaslanabilir olmalı (tek oturumda biter, kod yok) — ama madde 1'in kendi
sorusu (Vorion'un yapılandırılmış-çıktı şekli) gerçek doküman taraması gerektirebilir; bu
hâlâ "ölçüm" kapsamında (Barış'ın ekran görüntüsü paylaşması gerekebilir) ama Faz 8'in
kendi dilimlerinin (H2/H3 tarzı) derinliğine kaymamalı — yalnızca soru netleşsin, gerçek
kod J1'in işi.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bu oturumun kendi bulgu ve dilim planı),
`docs/oturumlar/README.md`'ye Faz 9'un kendi dilim tablosu (Faz 8'in kendi bölümüne benzer
yeni bir bölüm), `CLAUDE.md`'nin "Current state"ine "Phase: 9 of 12 — kapsam belirlendi,
henüz inşa edilmedi" türü bir güncelleme. Kod yok, ama docs değişikliği yine de
commit'lenmeli (yalnızca docs dokunduğu için düşük riskli — `AKIS.md`'nin kalıcı commit
yetkisi burada da geçerli).

---

**Model önerisi:** Sonnet 5 yeterli — bu bir kod-yazma değil envanter/karar oturumu.
Vorion'un yapılandırılmış-çıktı şeklinin doğrulanması (madde 1) gerçek implementasyon
oturumunun (J1) işi, bu oturumun değil — bu oturum yalnızca soruyu netleştirir ve
gerekiyorsa Barış'tan ilk ekran görüntüsü turunu ister.
