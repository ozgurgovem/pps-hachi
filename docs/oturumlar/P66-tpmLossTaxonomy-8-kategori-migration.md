# OTURUM — P-66: `tpmLossTaxonomy` 7→8 kategori şema migrasyonu

> Karar zaten verildi (`sema-veri-modeli-kararlari.md` §1, 2026-09-15, D-264): Barış
> `AskUserQuestion` ile "8 kategoriye geç (migration ile)" seçeneğini seçti — gerçek
> `PPS_A3_Format_TR.xls`'in 8-kategorili listesi (`TEMPLATE_ANALYSIS.md` §9.6, Bakım'ın
> Bağımsız/Profesyonel olarak ikiye bölünmesi) benimsenecek. **Ama migrasyonun kendi
> stratejisi (eski "Maintenance" verisi nereye gider) henüz sorulmadı** — bu oturumun kendi
> ilk işi, kod yazmadan ÖNCE bu tek soruyu sormak (`sema-veri-modeli-kararlari.md` §1.3'ün
> kendi notu).
>
> Kanonik konum: `docs/oturumlar/P66-tpmLossTaxonomy-8-kategori-migration.md`. Yazıldı:
> 2026-09-15.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
cat src/methods/tpmLossTaxonomy/categories.ts
  # TPM_LOSS_CATEGORIES'in hâlâ 7 elemanlı olduğunu doğrula: workSafety, cost, productivity,
  # quality, maintenance, humanResources, environment.

grep -n "9.6" reference/TEMPLATE_ANALYSIS.md
  # §9.6'nın kendi 8-kategori bulgusunu (satır numaraları değişmiş olabilir) yeniden oku —
  # Bağımsız Bakım (Autonomous Maintenance) / Profesyonel Bakım (Professional Maintenance)
  # ayrımının GERÇEK TR sıralamasını (diğer 6 kategoriye göre nereye oturuyor) doğrula.

grep -rn "TPM_LOSS_CATEGORIES\|TpmLossCategory" src/ src-tauri/
  # Kategori listesinin başka nerede tüketildiğini bul (Editor, renderToA3, i18n dictionary,
  # varsa Rust tarafında bir mirror) — hepsi güncellenmesi gereken yerler.

grep -n "runMigrations\|MIGRATIONS" src/domain/migrations/index.ts
  # D-57'nin kendi migration-zinciri mekanizmasının şu anki son adımını/schemaVersion'ını
  # doğrula — yeni migration bu zincire EKLENECEK, mevcut adımlar DEĞİŞMEYECEK.
```

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. Gerçek karar (kod yazmadan önce sorulmalı — henüz sorulmadı)

Eski bir projedeki `maintenance` kategorisinin verisi (`applies`/`severity`) migration'da NE
olacak? Üç gerçek seçenek, `AskUserQuestion` ile sorulmalı:

- **(a) Bağımsız Bakım'a eşle** — otonom/günlük bakım daha yaygın kayıp kaynağı olduğu için
  varsayılan tahmin, ama YANLIŞ olabilir (bir kullanıcının eski verisi asıl Profesyonel
  Bakım'ı işaretlemiş olabilir).
- **(b) Profesyonel Bakım'a eşle** — simetrik risk, ters varsayım.
- **(c) İkisine de kopyala, kullanıcıya elle düzeltme bırak** — hiçbir veri kaybolmaz ama
  `applies: true` iki kategoride birden görünür, bir kullanıcı A3'ünü export ettiğinde iki
  satır görür (yanlış ama en azından GÖRÜNÜR ve düzeltilebilir bir yanlışlık, sessizce
  kaybolan bir veri değil).
- **(d) Hiçbirine eşleme, "unspecified"/boş bırak, kullanıcı elle seçsin** — veri kaybı riski
  en yüksek (kullanıcı hiç fark etmezse kategori bilgisi kaybolur) ama en "dürüst" seçenek
  (yanlış bir tahmin dayatmaz).

Bu sorunun cevabı migration'ın kendi implementasyonunu belirler — kod yazmadan önce
sorulmalı, körü körüne (a) ya da (b) seçilmemeli.

---

## 2. Mekanik (karar sonrası)

### 2.1 Kategori listesi

`src/methods/tpmLossTaxonomy/categories.ts`: `TPM_LOSS_CATEGORIES` 8 elemana çıkar — TR
formunun gerçek sırasını izleyerek (§9.6'nın kendi bulgusu), örn.
`["workSafety", "cost", "productivity", "quality", "autonomousMaintenance",
"professionalMaintenance", "humanResources", "environment"]` (kesin isimler §9.6'nın gerçek
TR metnine göre teyit edilmeli — "Bağı. Bakım/Prof. Bakım" kısaltmalarının açık İngilizce
karşılığı ne olmalı, D-43'ün export-label ikiliğine (`Record<A3Language, string>`) uygun i18n
key'leri).

### 2.2 Migration

`src/domain/migrations/`'a yeni bir migration eklenir (D-57'nin kendi zinciri —
`schemaVersion` bir artırılır, mevcut migration'lar DEĞİŞMEZ). Migration, §1'de kararlaştırılan
stratejiye göre eski `payload.maintenance` alanını yeni iki alana (`autonomousMaintenance`/
`professionalMaintenance`) dönüştürür, eski `maintenance` alanını siler. **Yalnızca
`tpmLossTaxonomy` methodId'li entry'lerin payload'ına dokun** — diğer 56 method'un payload'ı
bu migration'dan tamamen bağımsız kalmalı (migration'ın kendi filtre mantığı `entry.methodId
=== "tpm-loss-taxonomy"` olmalı, yoksa başka bir method'un aynı isimli bir alanı varsa
[olmamalı ama garanti değil] yanlışlıkla dönüştürülebilir — bunu grep ile doğrula).

### 2.3 i18n

`methods.tpmLossTaxonomy.categories.*` key'lerinin TR+EN ikisi birlikte güncellenir —
`maintenance` key'i silinmez (eski migration testlerinin veya eski fixture'ların referans
verebileceği ihtimaline karşı — ama gerçek kullanım artık iki yeni key'i okur).

### 2.4 Editor/renderToA3

`Editor.tsx`/`renderToA3.ts`: `TPM_LOSS_CATEGORIES.filter/map` zaten generic (D-122'nin kendi
tasarımı) — 7'den 8'e çıkarken bu iki dosyada muhtemelen HİÇ değişiklik gerekmez, çünkü ikisi
de kategori listesini import edip döngüyle işliyor. Bunu KOD YAZMADAN önce doğrula (§0'ın
grep'i) — eğer gerçekten değişmiyorsa, bu bir sürpriz kolaylık, not olarak `DECISIONS.md`'ye
yazılmalı.

### 2.5 Fixture

`fixtures/ppsx/*.ppsx`'in hiçbiri `tpmLossTaxonomy` kullanmıyorsa (grep ile doğrula) bu dilim
fixture corpus'u etkilemez. Kullanan varsa `cargo run --bin gen_ppsx_fixtures` ile regenerate
+ diff kontrolü (D-62'nin kendi disiplini).

---

## 3. Test/doğrulama

- `categories.ts`/`schema.ts`'in kendi testleri: 8 kategori, doğru sıra.
- Migration testi: eski 7-kategorili bir payload'ın §1'de kararlaştırılan stratejiye göre
  DOĞRU dönüştüğünü kanıtlayan gerçek bir test (D-57'nin kendi migration-chain-contiguity
  testinin yanına).
- Eski bir `.ppsx` (7 kategorili, gerçek dosya, elle veya script'le üretilmiş) hâlâ AÇILIYOR mu
  — D-59'un "eski dosya her zaman açılır" LOCKED sözü, bu migration'ın kendi kanıtı.
- `scripts/gen-a3-fixture.ts` etkileniyorsa byte-diff kontrolü.

---

## 4. Bütçe ve kapanış disiplini

Tek yeni mekanizma: bir migration adımı (D-57'nin zincirine bir ekleme, YENİ bir migration
SİSTEMİ değil) — D-114'ün bütçesinin İÇİNDE.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, P-66'nın kendi satırının KAPANDI olarak
işaretlenmesi, `TEMPLATE_ANALYSIS.md` §9.6'nın kendi notunun "resolved, implemented" olarak
güncellenmesi.

---

**Model önerisi**: Sonnet 5 yeterli (D-28) — mevcut D-57 migration desenlerinin
genişletilmesi, derin mimari tasarım gerekmiyor. Asıl risk migration STRATEJİSİNİN (§1) doğru
sorulup cevaplanması, kodun kendisi mekanik.
