# OTURUM — P-39: Why-Why tree node-seviyesi referans adreslemesi

> Karar zaten verildi (D-185, Oturum C5, 2026-08-17, Option A) ve
> `sema-veri-modeli-kararlari.md`'nin kendi karar turunda (2026-09-15, D-265) yeniden
> doğrulandı: P-41'in kendi cross-linking sorusu "gerekmiyor, bağımsız kalsın" ile kapandığı
> için P-39, D-185'in kendi ihtimal ettiği "P-41 ile birleş" fırsatını KULLANMIYOR — bu kendi
> başına, bağımsız bir kod dilimi. **Bu oturumda Barış'a yeniden sorulacak bir tasarım sorusu
> YOK** — mekanik bir inşa turu.
>
> Kanonik konum: `docs/oturumlar/P39-node-seviyesi-referans.md`. Yazıldı: 2026-09-15.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
grep -n "targetNodeId" src/domain/model/reference.ts
  # Hiç eşleşme YOK bekleniyor — henüz inşa edilmedi.

sed -n '1,60p' src/domain/selectors/findOrphanedReferences.ts
  # findOrphanedReferences/findReferencesTo/listReferenceableEntries'in entry-only olduğunu
  # doğrula (bugün targetNodeId'den habersiz).

sed -n '1,80p' src/app/routes/workspace/EntryReferenceField.tsx
  # Bugün bir entry picker olduğunu doğrula — bir whyWhyTree hedefi seçildiğinde node
  # seçimine dair hiçbir UI olmamalı.

grep -n "WhyWhyNodeSchema\|outcome" src/methods/whyWhyTree/schema.ts
  # KN{N} numaralandırmasının render-time'da (flattenTree'nin depth-first sırası, D-71) türetildiğini,
  # hiç PERSIST edilmediğini doğrula — targetNodeId bir node.id'ye işaret edecek, KN{N}'e değil.
```

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. Mekanik (D-185/`sema-veri-modeli-kararlari.md` §2.2'den)

### 1.1 Şema

`src/domain/model/reference.ts`: `EntryReferenceSchema`'ya opsiyonel `targetNodeId:
z.string().optional()` eklenir. D-116'nın loose-`role` posturesiyle aynı ruhta — generic, yalnızca
`whyWhyTree` bugün kullanacak ama alan adı `whyWhyTree`'ye özgü değil (gelecekte başka bir
ağaç-şekilli payload da kullanabilir, D-39'un kendi notu). Omit edilmesi (undefined) bugünkü
davranışı birebir korur — mevcut her `.ppsx` değişmeden parse olur, migration YOK (D-51'in
optional-field-no-migration posturesi).

### 1.2 Üç selector — node-aware hale getir

`src/domain/selectors/findOrphanedReferences.ts`:

- `findOrphanedReferences`: bir referansın `targetNodeId` taşıması durumunda, hedef entry VAR
  olsa bile, o entry'nin (varsayım: `whyWhyTree` payload'ı) `nodes[]` listesinde o id'li bir
  node YOKSA da "orphan" say. Hedef entry'nin kendisi zaten yoksa (mevcut davranış) hiç
  değişmez.
- `findReferencesTo`: `targetNodeId` varsa dönen sonuca dahil et (arayan taraf hangi spesifik
  node'un referans aldığını görebilsin — G2/Traceability View, Faz 7/G2, bu bilgiyi kullanmak
  isteyebilir, ama bu dilim UI'yi zorunlu değiştirmiyor).
- `listReferenceableEntries`: DEĞİŞMEZ — bu, "hangi entry'ler hedef olabilir" listesi, node
  seviyesi ayrıntı `EntryReferenceField`'ın kendi ikinci seviyesine ait.

**Önemli**: bir entry'nin payload'ı `z.unknown()` (D-52) — bu selector'lar `src/domain`
altında yaşıyor ve `src/methods/*`'tan import edemez (G1'in kendi ESLint sınırı, D-196'nın
`evaluateReadiness`'te zaten kurduğu desen). `whyWhyTree`'nin `nodes[]` şeklini duck-type ile
oku (`payload.nodes` bir array mi, her elemanın `id` alanı string mi?) — tip güvenli bir import
DEĞİL, defensive bir runtime kontrolü (`RowTableEditor.tsx`'in `?? ""` deseninin bir üst
seviyesi, C1/D-180).

### 1.3 UI — `EntryReferenceField.tsx`'e ikinci seviye

Bugün: bir rol için bir entry listesi (buton listesi, filtre `Input`'lu). Bir `whyWhyTree`
hedefi seçildiğinde (methodId `== "why-why-tree"` kontrolü, D-99'un kendi contract'ı üzerinden
DEĞİL — bu dosya zaten `MethodPlugin.referenceRoles`'un declare-don't-render sınırının İÇİNDE,
ama seçilen entry'nin methodId'sini bilmek meşru, D-125'in kendi kuralı yalnızca "plugin'in
Editor'ü referans alanına dokunmaz" diyor, generic shell'in kendisi methodId'ye bakabilir),
o entry'nin kendi node listesi (KN{N} etiketleriyle, `confirmedRootCauseNumbers`'ın aynı
türetme mantığı) ikinci bir seviye olarak açılır. Node seçilmezse `targetNodeId` `undefined`
kalır — bugünkü entry-seviyesi davranış hâlâ geçerli bir seçenek (her referansın node'a
inmesi ZORUNLU değil).

---

## 2. Test/doğrulama

D-129'un kendi fixture deseni tekrarlanmalı: `fixtures/ppsx/fully-populated.ppsx`'e (veya yeni
bir fixture'a) bir `targetNodeId` taşıyan referans eklenir, hedef entry VAR ama o node
SİLİNMİŞSE (whyWhyTree'nin kendi node listesinden çıkarılmışsa) `findOrphanedReferences`'ın
bunu doğru şekilde "dangling" rapor ettiğini kanıtlayan gerçek bir Rust round-trip testi
(`cargo run --bin gen_ppsx_fixtures` ile regenerate, `write_ppsx`/`read_ppsx`'in şemayı
değiştirmediğini — `targetNodeId` sadece bir string alan, Rust tarafı zaten opaque JSON olarak
taşıyor, `src-tauri/src/ppsx/`'in HİÇBİR dosyası dokunulmamalı, sadece TS şeması).

Regresyon testleri, hepsi mutation-verified (D-143'ün kendi disiplini):
- `EntryReference` şeması: `targetNodeId` omit edilince eski `.ppsx` fixture'ları hâlâ parse
  oluyor (mevcut testler kırılmamalı).
- `findOrphanedReferences`: node silindiğinde orphan, node varken orphan değil.
- `EntryReferenceField`: bir whyWhyTree hedefi seçilince node listesi açılıyor, node seçilince
  `entry.update` dispatch ediliyor (referans objesi `targetNodeId` taşıyor).

---

## 3. Bütçe ve kapanış disiplini

Tek yeni mekanizma: node-seviyesi referans adresleme (şema + 3 selector + UI'nin ikinci
seviyesi) — D-114'ün "bir dilim = bir yeni mekanizma" bütçesinin İÇİNDE, çünkü bu zaten tek bir
tutarlı mekanizma (dört dosyaya yayılıyor ama hepsi aynı kararın parçaları).

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, P-39'un kendi satırının KAPANDI olarak
işaretlenmesi.

---

**Model önerisi**: Sonnet 5 yeterli (D-28) — mevcut D-57/D-116 desenlerinin genişletilmesi,
derin mimari tasarım gerekmiyor (zaten D-185'te karar verildi).
