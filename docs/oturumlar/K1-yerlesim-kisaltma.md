# OTURUM Faz 10 — K1: A3 yerleşim optimize edici + hücre bütçesine kısaltma

> Faz 10'un kendi kapsam belirleme oturumu (D-213, 2026-09-05) BİTTİ. Dört açık tasarım
> sorusu `AskUserQuestion` ile Barış'a soruldu, dördü de önerilen seçenekle onaylandı — bu
> dosya o kararların **birinci** dilimini uygular. Faz 10'un kendi dört dilimlik planı (tam
> kayıt `DECISIONS.md` D-213, `docs/oturumlar/README.md`'nin Faz 10 tablosu):
>
> - **K1 (bu dosya)** — A3 yerleşim optimize edici (§8.10 madde 1-3: primary/appendix kararı,
>   hücre bütçesine kısaltma, chart tercihi) + diff-preview arayüzü.
> - **K2** — mock-auditor review (§8.6 Review modu) + anlatı kopukluğu tespiti (§8.10 madde 4)
>   BİRLEŞİK — `evaluateReadiness`'in (D-196) S1-S8'ini okuyup tamamlar, yeniden hesaplamaz.
> - **K3** — TR↔EN çeviri, alan-bazlı + proje geneli.
> - **K4** — maliyet sayacı + `ai-log.jsonl` + Settings spend cap, K1-K3'ten SONRA (ölçecek
>   gerçek `complete_structured` trafiği olmadan anlamsız).
>
> Kanonik konum: `docs/oturumlar/K1-yerlesim-kisaltma.md`. Yazıldı: 2026-09-05, D-213'ün
> kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/faz10-kapsam-belirleme.md \
      src/domain/model/entry.ts \
      src/domain/commands/builders.ts \
      src/domain/readiness/evaluateReadiness.ts \
      src/a3/methodContract.ts \
      src/a3/buildA3Layout.ts \
      src/a3/layout/budget.ts \
      src/a3/layout/overflow.ts \
      src-tauri/src/ai/provider.rs \
      src-tauri/src/ai/vorion.rs \
      src/ai/prompts/library.ts \
      src/ai/entryProposal.ts \
      src/app/routes/workspace/EntryProposalField.tsx \
      src/app/routes/workspace/RightPanel.tsx \
      src/app/routes/workspace/EntryRow.tsx
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle**. Ayrıca şunu da doğrula — kendi
taramamdan (D-213):

```bash
grep -n "buildSetA3VisibilityCommand" src/domain/commands/builders.ts   # VAR bekleniyor
grep -n "a3Visibility" src/app/routes/workspace/EntryRow.tsx            # VAR bekleniyor —
  # manuel primary/appendix değiştirme zaten kurulu, K1 bunu YENİDEN İCAT ETMEZ, aynı
  # komutu AI-önerili bir diff'ten dispatch eder.
grep -n "TabsTrigger value=" src/app/routes/workspace/RightPanel.tsx    # üç sekme bekleniyor
  # (preview/traceability/assistant) — K1 dördüncüsünü ("review") ekler.
grep -n "getPromptFile" src/ai/prompts/library.ts                       # (step, methodId,
  # version) imzası bekleniyor — K1'in tüm-projeye-bakan promptu bu anahtara UYMUYOR,
  # §2.1 bunun küçük bir uzantısını (bu dilimin kendi kararı) gerektiriyor.
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-213** (bu fazın kapsam belirlemesi — dört sorunun tam gerekçesi + bu
   dilime taşınan üç bulgu), **D-196** (evaluateReadiness'in S1-S8'i — K1'in KONUSU DEĞİL, ama
   S1-S8'in okuduğu alanları/entry şekillerini tanımak K1'in kısaltma mantığının hangi
   alanlara dokunamayacağını anlamaya yardımcı olur), **D-204** (`complete_structured`'ın
   gerçek Vorion şekli — Synchronous Prediction üzerine kurulu bir istem-mühendisliği katmanı,
   Vorion'da yapılandırılmış-çıktıya özel bir alan YOK), **D-125** (generic-shell deseni —
   `EntryReferenceField`/`EntryImagesField`/`EntryRoundField`/`EntryProposalField`), **D-15/
   D-16** (assistant proposes/human accepts — LOCKED, K1'in diff'i de bu kuralın dışında
   DEĞİL: Accept'siz hiçbir yazma yolu olamaz), **D-100** (appendix/never-truncate garantisi —
   K1'in "primary/appendix kararı" zaten var olan `a3Visibility` alanına yazıyor, D-100'ün
   otomatik overflow davranışına PARALEL bir manuel/AI-önerili yol, onu değiştirmiyor).
3. `SPEC.md` §8.1 (Socratic-first, human-accepts, provenance zorunlu — LOCKED), §8.10 (bu
   dilimin kendi metni — dört madde, yalnızca 1-3 bu dilimde, 4 K2'ye taşındı), §8.7
   (structured output contract — Zod şeması zaten var olan mekanizma, J1/D-204'ün kurduğu
   retry-once deseni), §8.14 (context window aşımı — K1'in girdisi TÜM proje, bu gerçek bir
   risk, §2.6).
4. `src/domain/model/entry.ts` — `A3VisibilitySchema` (`"primary" | "appendix" | "hidden"`)
   zaten var, `Entry.a3Visibility` zorunlu alan. `src/domain/commands/builders.ts`'in
   `buildSetA3VisibilityCommand` — zaten var, zaten `EntryRow.tsx`'te manuel bir düğmeden
   dispatch ediliyor (D-213'ün kendi bulgusu). **K1 yeni bir domain alanı İCAT ETMEZ** —
   AI'nin önerdiği "bunu appendix'e taşı" kararı bu komutu dispatch eder, tıpkı kullanıcının
   elle tıklaması gibi.
5. `src/a3/layout/budget.ts` — her bloğun hücre bütçesi buradan okunur; K1'in
   `complete_structured` çağrısına hangi blokların ne kadar aştığı/sığdığı bilgisini bu
   dosyanın hesapladığı veriden vermek gerekecek (muhtemelen `buildA3Layout`'un zaten ürettiği
   `overflowWarnings`/descriptor'dan türetilir, D-98'in "never truncate" garantisiyle aynı
   veriyi tüketir).
6. `src/ai/entryProposal.ts` + `src/app/routes/workspace/EntryProposalField.tsx` — J1/D-204'ün
   kurduğu tek-entry proposal akışının somut örneği: Accept/Edit&Accept/Reject üçlüsü, Zod
   doğrulama + tek retry, `Provenance` doldurma. K1'in diff-proposal'ı BENZER bir akış ama
   TEK entry değil, PROJE GENELİ bir değişiklik kümesi öneriyor — aynı ilkeler (insan onayı,
   provenance, retry-once) geçerli kalır, ama UI şekli farklı olacak (bkz. §2.3).
7. `src/app/routes/workspace/RightPanel.tsx` — üç mevcut sekme (`preview`/`traceability`/
   `assistant`, `aiEnabled`'a koşullu). K1 dördüncü bir `"review"` sekmesi ekler, aynı
   `aiEnabled` koşuluna bağlı.
8. `src/ai/prompts/library.ts`'in `getPromptFile(step, methodId, version)` imzası —
   `{step, methodId}` çiftine bağlı, K1'in tüm-projeye-bakan promptuna UYMUYOR (D-213'ün kendi
   bulgusu #3). Bu dilimin kendi ilk kararı: paralel bir adresleme şeması (örn.
   `src/ai/prompts/whole-project/{purpose}.{version}.md`, `getPromptFile`'ın yanına yeni bir
   `getWholeProjectPromptFile(purpose, version)` gibi) — küçük bir uzantı, J1-J3'ün dosyalarını
   ETKİLEMEZ.

---

## 2. Kapsam

### 2.1 Prompt kütüphanesi adresleme uzantısı (küçük, bu dilimin ilk işi)

§0/§1 madde 8'in bulgusu: mevcut `{step, methodId, version}` anahtarı K1'e uymuyor. Bu
dilimin kendi kararı — muhtemelen `src/ai/prompts/whole-project/{purpose}.{version}.md`
(örn. `layout-review.v1.md`), front-matter şeması aynı kalır (`mode`, `contextSlices`,
`outputSchema`) ama `step`/`methodId` alanları yoktur, yerine `purpose: "layout-review"` gibi
bir alan olur. K2/K3 de bu şemayı yeniden kullanacak — burada kurulan şekil gelecekteki iki
dilimin de temeli olur, o yüzden isimlendirme/şekil kararı dikkatli verilmeli.

### 2.2 `complete_structured` girdisi — proje genelinin özeti

K1'in AI çağrısı tek bir method'un payload'ına değil, **tüm `ProjectModel`**'e bakıyor.
Girdi muhtemelen: her adımın her entry'sinin (title + kısa içerik özeti, tam payload değil —
context window'u şişirmeden, §8.14) + her bloğun bütçe durumu (`budget.ts`'ten, hangi
bloklar hangi oranda dolu/taşkın) + korunan token listesi (her entry'nin metninden
çıkarılmış sayı/tarih/parça-no/sahip adı — bunları çıkarma mantığı yeni, küçük bir yardımcı
fonksiyon, `redaction.rs`'in terim-eşleştirme desenine BENZEMEZ, tamamen ayrı bir amaç).
**Context window aşımı gerçek bir risk** (§8.14) — sekiz adımın tamamı + tüm entry'ler büyük
bir proje büyüklüğünde önemli olabilir; SPEC'in "reduce context slices in a defined priority
order, tell the user what was dropped" kuralı burada da geçerli, ama önceliklendirme sırası
(hangi adım/entry önce kısaltılır) bu dilimin kendi kararı.

### 2.3 `complete_structured` çıktısı — diff şekli

Yeni bir Zod şeması (K1'e özgü, herhangi bir method'un şeması DEĞİL): muhtemelen
`{ visibilityChanges: {entryId, newVisibility, reason}[], textCondensations: {entryId, field, condensedText, reason}[], chartPreferences: {stepId, preferredEntryId, reason}[] }` şeklinde
bir taslak — kesin alan adları/şekil bu dilimin kararı, ama üç ayrı liste olması muhtemel
(§8.10'un üç maddesi doğal olarak üç farklı değişiklik türü). **`chartPreferences`'ın ne
anlama geldiği netleştirilmeli**: birden fazla chart'lı bir adımda "en iyi mesajı taşıyan"
chart'ı öne çıkarmak muhtemelen ilgili entry'yi `primary` yapıp diğerlerini `appendix`'e
almakla AYNI mekanizma (`visibilityChanges`'in bir alt kümesi) — ayrı bir alan gerekip
gerekmediği bu dilimin kendi analiz işi, gereksizse `chartPreferences` `visibilityChanges`'e
katlanabilir (YAGNI).

### 2.4 Korunan-token doğrulaması (kabul öncesi, D-213'ün kararı)

Her `textCondensations` satırı için: orijinal metinden sayı/tarih/parça-no-benzeri/sahip-adı
token'ları çıkarılır (basit regex tabanlı bir yardımcı — Türkçe ve İngilizce tarih
formatlarını, ondalık ayıracını (`,`/`.`) da düşün, D-06/D-XX'in Türkçe karakter dersleri
burada da geçerli), kısaltılmış metinde HEPSİNİN hâlâ var olduğu kontrol edilir. Başarısızsa
D-204'ün retry-once deseni: doğrulama hatalarıyla (hangi token kayboldu) birlikte tek bir
yeniden deneme, ikinci başarısızlıkta o satır diff'ten ÇIKARILIR (kullanıcıya "bu alan
kısaltılamadı, elle düzenleyin" notuyla) — SPEC'in "content is never deleted" ilkesi burada
"kısaltma önerisi sessizce reddedilir, orijinal metin dokunulmadan kalır" şeklinde okunur.

### 2.5 RightPanel'in yeni "Review" sekmesi

D-213'ün onaylanan kararı: kalıcı 4. sekme, `aiEnabled`'a koşullu (mevcut `assistant`
sekmesiyle aynı gate). İçerik: "Analiz et" tetikleyicisi → `complete_structured` çağrısı →
gelen diff'i mevcut descriptor'la yan yana (veya satır satır: "Adım 3'teki X entry'si
appendix'e taşınacak", "Adım 1'deki gap açıklaması şu şekilde kısalacak: [önce]/[sonra]")
gösteren bir liste. Her değişiklik satırı ayrı ayrı **kabul/reddedilebilir** olmalı mı
(granüler diff) yoksa tek bir toplu Accept/Reject mi (D-15'in "insan onaylar" ilkesi ikisini
de destekler, ama granüler kontrol muhtemelen daha güvenli — SPEC'in kendi "previewed side by
side" cümlesi bir liste öneriyor, tek büyük buton değil) — **bu oturumun kendi kararı**,
muhtemelen granüler (her satırın kendi checkbox'ı/Accept butonu), Barış'a `AskUserQuestion`
ile sorulabilir eğer iki yaklaşım da makul maliyetliyse.

Accept (tümü veya seçili satırlar) → her `visibilityChanges` satırı için
`buildSetA3VisibilityCommand`, her `textCondensations` satırı için `buildUpdateEntryCommand`
(ilgili alanı güncelleyen) dispatch edilir — **tek bir undo adımı** olarak mı (birden fazla
komutu tek bir batch'e saran bir mekanizma var mı, yoksa `dispatch()` zaten ardışık
komutları ayrı undo adımları olarak mı tutuyor — `src/domain/commands/`'ı kontrol et) yoksa
her satır kendi undo adımı mı olacak, bu dilimin kendi kararı.

### 2.6 Provenance

Her değiştirilen entry, K1'in Accept'i sonucu güncellenen alanlar için `Provenance` taşımalı
mı (D-201/D-204'ün `origin: "ai-accepted"/"ai-edited"` deseni burada da geçerli mi, yoksa bu
"düzenleme" (yeni bir entry değil, var olan bir entry'nin küçük bir alanının değişimi)
`Provenance`'ın kendi tasarımına nasıl uyuyor — `Entry.provenance` tek bir alan mı, yoksa
alan-bazlı mı, `entry.ts`'i kontrol et) — §8.13'ün "her entry `Provenance` taşır" LOCKED
kuralı burada nasıl uygulanacağı bu dilimin kendi tasarım kararı.

### 2.7 Done-koşulu

- Prompt kütüphanesi tüm-projeye-bakan promptlar için genişletildi (§2.1).
- RightPanel'in "Review" sekmesi gerçek bir Vorion `complete_structured` çağrısıyla bir diff
  üretiyor, elle test edilebilir bir projede.
- Diff'in her satırı gözden geçirilebilir, Accept yalnızca kullanıcı onayıyla
  `ProjectModel`'e yazıyor (mevcut `buildSetA3VisibilityCommand`/`buildUpdateEntryCommand`
  üzerinden, yeni bir yazma yolu İCAT EDİLMEDEN).
- Korunan token'lar (sayı/tarih/parça no/sahip) hiçbir kısaltmada kaybolmuyor — bir birim
  testi bunu doğrudan kanıtlıyor (bilerek bir token'ı düşüren sahte bir AI yanıtıyla).
- Content asla silinmiyor — yalnızca `appendix`/`hidden`'a taşınıyor, geri alınabilir
  (D-100'ün ilkesi).
- `npm test`/`cargo test` yeşil, exit code ayrı kontrol edilir (D-143'ün dersi), lint/build/
  clippy/fmt hepsi temiz.
- Faz 10'un kendi acceptance senaryosunun ilk yarısı ("rewrites an overflowing A3 into
  budget without losing meaning") bu dilimle kanıtlanabilir hale geliyor — gerçek Vorion
  round-trip'i yine "dürüstçe doğrulanmamış, Barış'ın kendi `npm run tauri dev` turu owed"
  kategorisinde kalabilir (bu ortamda ekran/Tauri çalışma zamanı yok).

---

## 3. Kapsam dışı

- **K2** — mock-auditor review, anlatı kopukluğu tespiti (§8.10 madde 4) — bilerek K1'den
  ÇIKARILDI (D-213), farklı bir UI şekli (bulgu listesi, diff değil) ve `evaluateReadiness`
  ile doğrudan etkileşiyor.
- **K3** — TR↔EN çeviri.
- **K4** — maliyet sayacı/`ai-log.jsonl`/spend cap. K1'in kendi `complete_structured`
  çağrıları token/cost verisi üretebilir (D-213'ün bulgusu — Synchronous Prediction'ın
  yanıtı zaten bunu taşıyor) ama bu dilim onu OKUMAZ/KAYDETMEZ — K4'ün işi.
- `RedactionPolicySchema`'nın `customers-and-parts`/`custom` modları (P-54) — K1 mevcut
  `off`/`customers` politikasını değişmeden kullanır.
- P-48 (Resume Stream), P-50 (`contextSlices` front-matter alanı — K1 bunu GERÇEKTEN
  tüketen ilk yer olabilir, dokunmadan önce kontrol et), P-51 (redaction yalnızca
  `complete_structured`'a bağlı — K1 de `complete_structured` kullandığı için bu sınırın
  İÇİNDE kalır, yeni bir sızıntı yüzeyi AÇMAZ), P-52 — dokunulmaz, yalnızca not düşülür.
- Vorion'un Agent/RAG/Marketplace/Custom Assistants yüzeyi — D-199'un LOCKED sınırı.

---

## 4. Bütçe ve kapanış disiplini

Bu dilim Faz 9'un J1'inden daha karmaşık olabilir — J1 tek bir method'un (Pareto) şemasına
karşı çalıştı, K1 TÜM projeye bakan yeni bir şema + yeni bir UI şekli (diff-preview,
generic-shell desenlerinin hiçbirine birebir uymayan) + context-window bütçeleme
gerektiriyor. D-114'ün "dilim başına bir mekanizma" bütçesi burada gergin olabilir — §2.2'nin
context-bütçeleme sorusu veya §2.3'ün diff şeması beklenenden karmaşık çıkarsa bu dilim
ikiye bölünmeyi düşünmeli (örn. K1a: yalnızca visibility/appendix kararı, K1b: metin
kısaltma + korunan-token doğrulaması) — tek oturumda bitirmeye zorlanmasın.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'nin K1 satırı
güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir. K2'nin kendi launch prompt'u bu
oturumun kapanışında veya bağımsız olarak yazılabilir.

---

**Model önerisi:** Diff-proposal şeklinin (§2.3) ve context-bütçeleme sırasının (§2.2)
tasarımı gerçek mimari kararlar — D-28'in routing mantığına göre Opus değerlendirilebilir.
Prompt-kütüphanesi uzantısı (§2.1) ve mevcut `buildSetA3VisibilityCommand`/
`buildUpdateEntryCommand`'ı yeniden kullanma kısmı J1/D-204'ün kurduğu desenin devamı,
Sonnet 5 yeterli kalır.
