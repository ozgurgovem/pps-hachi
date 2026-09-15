# OTURUM — Şema/veri modeli kararları: P-39 + P-41 + P-66

> Üç bağımsız madde, hepsi kod yazmadan ÖNCE Barış'ın kendi kararını gerektiriyor — üçü de
> `docs/oturumlar/P-yigini-durum-taramasi.md`'nin kendi taramasında (2026-09-15) doğrulandı.
> **Bu oturumun kendi işi büyük ölçüde bir KARAR turu, bir kod dilimi değil** — üçü de
> `AskUserQuestion` ile Barış'a sorulmadan tek satır kod yazılmamalı. Kararlar netleştikten
> sonra gerçek kod ayrı bir/birkaç oturuma düşer (D-114'ün bütçesi).
>
> Kanonik konum: `docs/oturumlar/sema-veri-modeli-kararlari.md`. Yazıldı: 2026-09-15.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
grep -n "P-39\|P-41\|P-66" DECISIONS.md | grep "^[0-9]*:| P-"
  # Üçünün de hâlâ OPEN olduğunu teyit et.

grep -n "targetNodeId" src/domain/model/reference.ts
  # P-39: hiç eşleşme YOK bekleniyor.

grep -n "category" src/methods/tpmLossTaxonomy/schema.ts | head -5
grep -n "Maintenance\|Bağı\|Prof" reference/TEMPLATE_ANALYSIS.md | grep -i "9.6\|8-cat\|7-cat" | head -5
  # P-66: tpmLossTaxonomy'nin gerçek kategori sayısını (7 mi) ve TEMPLATE_ANALYSIS.md §9.6'nın
  # kendi 8-kategori bulgusunu (Bakım'ın ikiye bölünmüş olması) doğrula.

grep -n "referenceRoles" src/methods/fishbone/index.ts src/methods/fiveWhy/index.ts src/methods/whyWhyTree/index.ts
  # P-41: üçünün de hiçbir cross-linking referenceRole taşımadığını doğrula.
```

---

## 1. P-66 — `tpmLossTaxonomy` 7 kategori (ENG) vs gerçek TR formunun 8 kategorisi

### 1.1 Sorun

D-122 (Faz 6a, zaten şevk edilmiş) `tpmLossTaxonomy`'yi `PPS_A3_Format_ENG.xls`'in 7-kategorili
listesiyle (Work Safety/Costing/Productivity/Quality/Maintenance/Human Resources/Environment)
kurdu. Gerçek `PPS_A3_Format_TR.xls` — `farplas-7step-tr`'nin "byte-faithful to the approved
form" olduğu iddia ettiği kaynak — 8 kategori taşıyor (`TEMPLATE_ANALYSIS.md` §9.6): Bakım
ikiye bölünmüş (Bağımsız Bakım / Profesyonel Bakım). Bu, P-62 kapsam belirleme oturumunda
(D-232) rastlantısal bulundu — `-en`/`-plus`'la ilgisiz, hâlihazırda şevk edilmiş
`farplas-7step-tr` üretiminin kendi bir doğruluk boşluğu.

### 1.2 Gerçek karar (kod yazmadan önce sorulmalı)

Bu bir ŞEMA değişikliği — kategori sayısı `.ppsx` içinde persist ediliyor
(`tpmLossTaxonomy/schema.ts`), mevcut projeleri etkiler, bir migration gerektirir (D-57'nin
kendi migration-zinciri mekanizması). `AskUserQuestion` ile üç seçenek sun:

- **(a) Gerçek TR formunun 8 kategorisine geç** — migration + geriye dönük uyumluluk yazılır,
  daha doğru ama daha pahalı.
- **(b) Şu anki 7-kategorili ENG-tarzı listeyi bilinçli bir basitleştirme olarak kabul et** —
  `SPEC.md` §3.0'ın kendi orijinal metni zaten 7 diyor, muhtemelen bu ayrımı hiç fark etmeden;
  satırı "kabul edilen sınır" diye kapat.
- **(c) İkisini de destekle** — template'e göre farklı kategori seti (TR formu 8, ENG/genel
  form 7) — en pahalı, muhtemelen gereksiz karmaşıklık (YAGNI riski).

### 1.3 Karar sonrası (yalnızca (a) seçilirse)

`src/domain/migrations/`'a yeni bir migration, `tpmLossTaxonomy/schema.ts`'nin kategori
enum'unu genişlet (eski projelerdeki 7 kategoriden birini otomatik ikiye bölmek mümkün değil —
migration'ın kendi stratejisi: eski "Maintenance" değerini iki yeni kategoriden hangisine
eşleyeceği, ya da her ikisini de "unspecified" bırakıp kullanıcıya elle düzeltme mi
bırakılacağı, ayrı bir tasarım sorusu).

---

## 2. P-39 — Why-Why tree node-seviyesi referans adreslemesi (D-185, Option A karar verildi ama inşa edilmedi)

### 2.1 Mevcut durum

D-185 (Oturum C5) zaten Barış'a soruldu ve **Option A** seçildi: `EntryReference` (D-116)
opsiyonel bir `targetNodeId?: string` kazanacak, böylece bir referans bir `whyWhyTree`
entry'sinin payload'ı içindeki TEK bir leaf'e (KN{N}) işaret edebilecek — bugün yalnızca tüm
entry'ye işaret edebiliyor. **Karar zaten verildi (bu oturumda yeniden sorulmasına gerek yok)
— yalnızca inşa edilmedi.**

### 2.2 Mekanik

`src/domain/model/reference.ts`'e `targetNodeId?: string` eklenir. Üç selector
(`findOrphanedReferences`/`findReferencesTo`/`listReferenceableEntries`,
`src/domain/selectors/findOrphanedReferences.ts`) bugün entry-only — node-aware hale
getirilmeli (bir referansın "orphan" olup olmadığı artık hedef entry'nin VARLIĞI değil, hedef
node'un o entry'nin payload'ı İÇİNDE hâlâ var olup olmadığına bağlı). `EntryReferenceField.tsx`
bugün bir entry picker — bir `whyWhyTree` hedefi seçildiğinde, o entry'nin kendi node listesini
(KN{N} etiketleriyle) gösteren ikinci bir seviye gerekiyor.

### 2.3 Test/doğrulama

D-129'un kendi fixture deseni (bilerek dangling bir referans taşıyan `fully-populated.ppsx`)
tekrarlanmalı: bir `targetNodeId`'nin, hedef entry VAR ama o node SİLİNMİŞSE (whyWhyTree'nin
kendi node listesinden çıkarılmışsa) doğru şekilde "dangling" raporlandığını kanıtlayan bir
gerçek Rust round-trip testi.

---

## 3. P-41 — Fishbone↔5-Why cross-linking, Step-4 workflow tasarım sorusu

### 3.1 Sorun (Barış'ın kendi sözleriyle, D-186/Oturum C6'da raporlandı)

İki ayrı ama ilişkili soru: (1) Fishbone'un her tespit edilen nedeninin kendi bağlı 5-Why
drill-down'ı olmalı mı? (2) Fishbone'u tamamen atlayan bir Step-4 iş akışı (saf dallanan
5-Why, EK-2905'in gerçek pratiğiyle eşleşen) birinci sınıf desteklenen bir yol mu olmalı, yoksa
iki bağımsız plugin'in (fishbone, fiveWhy/whyWhyTree) rastlantısal izin verdiği örtük bir
olasılık olarak mı kalmalı?

### 3.2 Neden zor

D-11'in LOCKED kanonik çerçevesine (Fishbone, Step 4'ün neden-hipotezi üreticisi) VE D-169/C6'nın
zaten şevk edilmiş Step 4 tier atamasına (fishbone+fiveWhy+whyWhyTree, ÜÇÜ de eşit ağırlıkta
"recommended" — Option B, "fishbone'u değiştir" Option C DEĞİL) dokunuyor. Bir cross-linking
mekanizması (bir Fishbone nedeninin hangi 5-Why zincirinin onu araştırdığını temsil etmesi) ya
yeni bir referans rolü (D-116-şekilli ama aynı-adım, D-179'un `error-proofing-hierarchy`
emsali) ya da bir node-seviyesi mekanizma (P-39-şekilli, eğer hedef tüm entry değil tek bir
Fishbone dalıysa) gerektiriyor.

### 3.3 Gerçek karar (kod yazmadan önce sorulmalı)

`AskUserQuestion` ile iki ayrı soru:

- **(1) Cross-linking mekanizması gerekli mi, yoksa bu iki independent plugin olarak mı
  kalsın** (mevcut durum, D-169'un kendi onayladığı "üç eşit yöntem" felsefesiyle tutarlı)?
  Gerekiyorsa: aynı-adım referans rolü mü, yoksa node-seviyesi (P-39'un kendi mekanizmasının
  bir üçüncü uygulaması) mı?
- **(2) D-169'un Step 4 tier tablosu (fishbone+fiveWhy+whyWhyTree, hepsi "recommended")
  Barış'ın kendi pratiğine (5-Why-öncelikli) göre yeniden mi gözden geçirilmeli, yoksa mevcut
  eşit-ağırlık zaten doğru mu?**

### 3.4 Karar sonrası

Seçime bağlı — eğer cross-linking isteniyorsa, P-39'un kendi mekanizması (eğer node-seviyesi
seçilirse) bu maddeyle BİRLEŞTİRİLEBİLİR (aynı `targetNodeId` alanı hem Why-Why tree içi hem
Fishbone→5-Why linki için kullanılabilir) — bu, iki maddeyi tek bir oturuma indirger. Bu
birleşme fırsatı kodlamadan ÖNCE, karar turunda değerlendirilmeli.

---

## 4. Bütçe ve kapanış disiplini

**Öneri: önce TEK bir `AskUserQuestion` oturumu, üçünün de (P-66'nın 3 seçeneği, P-41'in 2
sorusu, P-39'un zaten-kararlı-ama-inşa-edilmemiş durumu) Barış'a birlikte sorulduğu — sonra
kararlara göre gerçek kod ayrı dilimlere bölünür** (P-39+P-41'in node-seviyesi kısmı
birleşebilir; P-66 tamamen ayrı, migration gerektiriyorsa kendi dilimi).

Kapanışta: `DECISIONS.md`'ye kararların kendisi (yeni D-numaraları) + varsa kod dilimlerinin
kendi launch prompt'ları.

---

**Model önerisi**: karar turu için Sonnet 5 yeterli (D-28) — asıl zorluk derin akıl yürütme
değil, Barış'a doğru soruları sormak. Migration/node-seviyesi referans kodu için de Sonnet 5
yeterli, mevcut D-57/D-116 desenlerinin genişletilmesi.
