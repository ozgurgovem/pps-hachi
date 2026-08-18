# OTURUM D2b — blok hizası düzeltmesi (D2'nin bulduğu kök nedenin düzeltilmesi)

> D2 (`D2-blok-hizasi.md`) bilerek bir keşif oturumuydu — kod yazmadı, kök nedeni buldu ve
> belgeledi (D-189), düzeltmeyi kendi §2.4 kuralı gereği ayrı bir dilime bıraktı: bulgu
> `smart-target`'ın **hâlâ LOCKED, D-178'de görsel onaylı** render şeklini değiştirecek bir
> mekanizma değişikliği gerektiriyordu, ve o tek başına aynı oturumda hem keşif hem büyük
> düzeltme yapmayı Anayasa G4'e (şişmiş oturum) sokardı. Bu dosya o düzeltme dilimi — **P-43**.
>
> Kanonik konum: `docs/oturumlar/D2b-blok-hizasi-duzeltme.md`. Yazıldı: 2026-08-18, D2'nin
> kapanışının hemen ardından, Barış'ın açık isteğiyle ("yeni oturum için prompt paylaşır
> mısın?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 reference/TEMPLATE_ANALYSIS.md DECISIONS.md CLAUDE.md \
      docs/oturumlar/D2-blok-hizasi.md \
      src/a3/layout/placeZones.ts src/a3/layout/place.ts src/a3/layout/measure.ts \
      src/a3/layout/contentStyle.ts src/a3/methodContract.ts src/a3/buildA3Layout.ts \
      src/a3/templates/farplas-7step-tr.ts src/a3/templates/types.ts \
      src/methods/smartTarget/renderToA3.ts src/methods/smartTarget/schema.ts \
      src/methods/fiveN1K/renderToA3.ts src/methods/fiveN1K/schema.ts \
      src-tauri/src/xlsx/writer.rs \
      src/a3/p25TwoImageEntries.probe.test.ts \
      src/a3/distributionChartThreeImageEntries.probe.test.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-18'de doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made", "How I want you to work" (plan onayı, TDD), **Block
   Visual Verification Loop**'un tam tarifi (bu oturum ADIM 1 ve ADIM 3'ü **yeniden** bu döngüden
   geçirecek — döngü zaten bir kez her ikisi için de çalıştı, D-165 v2/D-178), ve "Current
   state"in **Oturum D — D2** paragrafı (bu dilimin doğrudan girdisi).
3. `DECISIONS.md`: **D-189** (kök nedenin kendisi — iki kusur, tam mekanizma), **P-43** (bu
   dilimin kapatacağı madde), **P-26**'nın son hali, **D-38** (LOCKED — `smart-target`'ın
   üç-zon tasarım kararı, "Step 3 does NOT get re-cut" ilkesi), **D-178** (LOCKED — `smart-target`
   zaten bir kez görsel onaylandı, bu oturum o onayı **geçersiz kılmıyor**, yeniden doğruluyor),
   **D-102/D-107/D-111** (D-102's `zones` mekanizmasının kendisi + iki önceki jenerik düzeltme —
   **her ikisi de özel-durum değil, mekanizmanın kendisini düzeltti**; bu oturumun izleyeceği
   emsal budur, `five-n1k`'e özel bir yama değil), **D-155/D-156** (Adım 3'ün tek satırının
   neden 153.75 pt olduğu — "iki uçtan düzeltme").
4. `reference/TEMPLATE_ANALYSIS.md` §15 — D2'nin kendi bulgu yazısı, tam sayılarla (kolon
   genişlikleri, satır yükseklikleri, XML kanıtı). **Bu oturumun temel referans metni.**
5. `src/a3/layout/placeZones.ts` (144 satır) — özellikle `splitColumnsIntoZones` (satır ~27-72,
   kusur 2'nin yeri) ve `placeZonesContent` (satır ~82-143, kusur 1'in yeri, özellikle satır
   ~118-124'teki `join("\n")` tek-satır yazımı).
6. `src/a3/layout/place.ts` — `placeZonesContent`'i nasıl çağırdığı (satır ~82-100): `row`
   (mevcut imleç) ile `lastRow` (bloğun `contentRows.end`'i) arasındaki **tüm kalan bandı**
   veriyor, `placeZonesContent`'e — **kritik gözlem, bu oturum doğrulamalı**: `five-n1k` için bu
   bant genellikle 1'den fazla satır (Adım 1'in 30 pt'lik satırlarında bolca boş satır var,
   D2'nin fixture'ında row=10'dan lastRow=21'e kadar 12 satır), ama `smart-target` için bant
   **tam olarak 1 satır** (Adım 3'ün `contentRows.start === contentRows.end === 58`) — şablonun
   kendisinde o konumda başka satır **yok**. Bu, düzeltmenin iki yöntem için neden farklı
   davranması gerektiğinin köküdür (aşağıdaki §2.2).
7. `src/methods/smartTarget/renderToA3.ts` + `src/methods/fiveN1K/renderToA3.ts` — iki gerçek
   çağıran, zon şekilleri farklı (SmartTarget: değişken satır sayılı 3 zon + 1 görüntü zonu;
   5N1K: sabit 2-satırlı 6 eşit zon).
8. `CLAUDE.md`'nin Block Visual Verification Loop'unun kendi 8 adımı — bu oturumun kapanışında
   **iki kez** (ADIM 1 için `five-n1k`, ADIM 3 için `smart-target`) yürütülecek. Kümülatif
   artifact aynı URL'de: `https://claude.ai/code/artifact/b1ae2136-9785-4985-b7a3-587663d38466`
   (B3'ün kendi artifact'i — aynı dosya yoluna redeploy et, yeni bir artifact **açma**).

---

## 2. Kapsam

### 2.1 Neyin düzeltileceği — D-189'un iki kusuru, jenerik mekanizmada

**D-102/D-107/D-111 emsali bağlayıcı: düzeltme `placeZones.ts`'in kendisinde yapılır, `five-n1k`'e
özel bir yama olarak değil.** Bu, LOCKED bir tasarımı (`smart-target`, D-38) etkileyen bir karar
olduğu için kodlamadan önce Barış'a kısa bir plan olarak onaylatılmalı (`CLAUDE.md`'nin kendi
kuralı) — ama iki kusurun **hangi algoritmayla** düzeltileceği gerçek bir tasarım seçimi ve
`AskUserQuestion` ile sorulmalı (aşağıdaki §2.2/§2.3).

### 2.2 Kusur 1 — çok satırlı zon içeriği tek satıra sıkışıyor

**Önerilen yön (bir öneri, mandat değil):** `placeZonesContent`, bir zonun ihtiyaç duyduğu satır
sayısını (`zone.lines.length`, tüm zonların en büyüğü) ile **gerçekte mevcut olan** satır sayısını
(`lastRow - startRow + 1`, çağıranın verdiği bant) karşılaştırıp `min(ihtiyaç, mevcut)` kadar satır
kullanmalı — her zonun kendi satırları, `place.ts`'in zon-olmayan yolunun zaten yaptığı gibi,
bir satır bir satıra yazılmalı (`row += 1` deseni), tek bir hücrede `join("\n")` **DEĞİL**.

Bu tasarım **geriye dönük uyumluluğu doğal olarak koruyor olmalı** (doğrulanmalı, varsayılmamalı):
`smart-target`'ın bandı tam olarak 1 satır (`Adım 3`'ün tek 153.75 pt satırı) olduğundan,
`min(ihtiyaç, 1) = 1` — algoritma otomatik olarak bugünkü "tek hücrede sarılmış çoklu satır"
davranışına düşer, **sıfır görsel değişiklik** beklenir. `five-n1k`'in bandı 12 satır olduğundan,
2 satırlık her zon artık kendi 2 satırını gerçekten 2 ayrı satıra yazar — bugün görünmeyen/kırpılan
cevap satırı artık kendi 30 pt'lik satırında görünür olur.

**`AskUserQuestion` ile sorulması gereken gerçek tasarım seçimi:** birden fazla zon aynı bantta
farklı satır ihtiyacı taşıyorsa (örn. 5N1K'de hepsi 2 satır ama gelecekte farklı olabilir), kısa
zonun fazladan satırı ne yapmalı?
- **Seçenek A (üstten hizala, önerilen)** — kısa zonun boş kalan satırları altta boş bırakılır.
  En basit, en öngörülebilir, zon-olmayan `lines` yolunun zaten yaptığıyla tutarlı.
- **Seçenek B (dikey ortala)** — kısa zonun içeriği ayrılan bandın ortasına yerleştirilir.
  Görsel olarak daha "dengeli" olabilir ama `A3TextLine`/hücre yerleşim mantığına yeni bir
  hizalama kavramı ekler.

Barış'ın seçimi netleşmeden Zon B/C gibi (görüntü taşıyan) zonların bu satır-sayımına nasıl
katıldığı da netleşmeli — bir görüntü zonu (`zone.image`, `zone.lines` yok) satır ihtiyacına
**sıfır** katkıda bulunmalı (bugünkü `bandHeightPt` görüntü zonu için zaten tüm bandı kullanıyor,
bu davranış değişmemeli).

### 2.3 Kusur 2 — açgözlü kolon-eşleme dar "ayraç" kolonlarını hesaba katmıyor

`splitColumnsIntoZones`'un bugünkü "kümülatif genişlik hedefe ulaşana/geçene kadar kolon tüket"
kuralı, `farplas-7step-tr`'nin B:O aralığındaki dengesiz kolonları (D=15.75, H=18, L=18,
**O=8.25** pt vs. komşularının 112-238 pt'i) hesaba katmıyor. **`AskUserQuestion` ile sorulması
gereken üç gerçek seçenek** (§15.3'ün TEMPLATE_ANALYSIS.md'deki tam sayı tablosuna bakarak
karşılaştırılmalı):

- **Seçenek A — en-yakın-sınıra yuvarlama.** Bugünkü "ilk hedefi geçen" yerine, hedefe en yakın
  aday sınırı (hedefin altında veya üstünde) seç. Genel olarak daha dengeli bölümler üretir ama
  bir zonun **tamamen** dar bir kolona düşmesini yapısal olarak garanti altına almaz — yalnızca
  istatistiksel olarak azaltır.
- **Seçenek B — dar kolonları "ayraç" olarak ele al.** Bir eşik altındaki kolonlar (örn. blok
  genişliğinin medyan kolonunun belirli bir oranından dar olanlar) kendi başına bir zon
  oluşturamaz — en yakın komşu zona otomatik yutulur. Asıl bozulma şeklini (bir zonun **yalnızca**
  ayraçtan oluşması) doğrudan hedefler ama yeni bir eşik sabiti gerektirir ve gerekçelendirilmeli.
- **Seçenek C — en dar/en az iş** (CLAUDE.md'nin "gereksiz soyutlama ekleme" ilkesine en yakın) —
  algoritmayı olduğu gibi bırak, yalnızca bir son-kontrol ekle: bir zonun atanan genişliği çok
  düşükse (örn. eşit-bölünmenin belirli bir oranının altında), komşu (daha geniş) zondan bir
  kolon "ödünç al". Gözlemlenen bozulma şeklini doğrudan hedefleyen en küçük değişiklik.

Prompt bir seçenek önermiyor — üçü de `smart-target`'ın bugünkü (490.5/530.25/373.5 pt) bölümünü
az ya da çok değiştirebilir; hangisi değiştirirse Block Visual Verification Loop bunu yakalamalı.

### 2.4 TDD — kırmızıdan yeşile

`D2-blok-hizasi.md`'nin kendi geçici prob'ları silindi (D-136'nın disiplini); bu oturum **kalıcı**
regresyon testleri yazmalı, önce KIRMIZI kanıtlanıp sonra düzeltilerek:
- Bir 2-satırlı zon (bugünkü davranışta) tek bir hücrede `\n` ile birleşik metin taşıyor —
  düzeltmeden sonra (bant ≥2 satırsa) **iki ayrı hücrede** iki ayrı satır taşımalı.
- `five-n1k`'in "NEREDE?" zonunun kolon genişliği bugün 8.25 pt (tek başına O kolonu) —
  düzeltmeden sonra kardeşlerinin genişliğine (240-383 pt) makul ölçüde yakın olmalı, hiçbir zon
  tek başına bir "ayraç" kolonuna düşmemeli.
- `smart-target`'ın bugünkü 3 zon genişliği + tek-satır davranışı için **regresyon** testi
  (değişmediğini kanıtlayan, `xlsxSurvival.test.ts`'e ek) — Kusur 1'in fix'i Adım 3'te sıfır
  görsel değişiklik üretmeli, bu iddia testle kanıtlanmalı, varsayılmamalı.

### 2.5 Görsel yeniden-doğrulama — ZORUNLU, atlanamaz

Düzeltme `smart-target`'ın LOCKED/D-178-onaylı görselini etkileyebileceği için (Kusur 2'nin
algoritması özellikle), **CLAUDE.md'nin Block Visual Verification Loop'u ADIM 1 (`five-n1k`) ve
ADIM 3 (`smart-target`) için tekrar çalıştırılmalı** — gerçek pt→px ölçekte, gerçek örnek
içerikle, aynı kümülatif artifact'e (yukarıdaki URL) redeploy edilerek, Barış'ın somut/görsel
onayı alınana kadar. Bir birim testin geçmesi **yeterli değil** — bu projenin kendi kuralı
(`CLAUDE.md`'nin "Block Visual Verification Loop" bölümü, "prose decisions... are not
trustworthy on their own" cümlesiyle).

---

## 3. Kapsam dışı

- Şablon dosyasının kendisi (`src/a3/templates/*`'e yeni şablon) — D-95, Faz 11.
- `MethodPlugin.tier`/`MethodBand`, esnek tahsis — Oturum C'nin işiydi, kapandı.
- P-42 (Fishbone'un dil kaynağı hatası) — ilgisiz, ayrı kusur sınıfı.
- `place.ts`'in zon-olmayan (`lines`) yolu — D2'de zaten temiz bulundu (§15.2), dokunulmaz.
- Yeni bir `A3ContentZone` alanı (örn. hizalama modu) eklemek **yalnızca** §2.2'nin
  `AskUserQuestion`'ı Seçenek B'yi (dikey ortalama) seçerse gerekir — Seçenek A seçilirse bu
  kapsam dışıdır.

---

## 4. Bütçe ve kapanış disiplini

Bu dilim D2'nin kendi bulgusunun **doğrudan devamı** — büyüklüğü D2'den daha küçük olmalı (iki
dosyada [`placeZones.ts`, belki `place.ts`'in bant hesaplaması] hedefli bir düzeltme + testler +
iki görsel doğrulama turu), ama görsel doğrulama turlarının kaç round süreceği önceden bilinmiyor
(B3'ün kendi geçmişi: 1-3 tur arası). Açılışta kaba bir tahmin ver.

TDD zorunlu (§2.4). Kapanışta: `npm test`/`npm run lint`/`npm run build` ve `cargo test`/
`cargo clippy`/`cargo fmt` hepsi yeşil — `npm test`'in **exit code**'u ayrı bir logfile + `echo $?`
ile kontrol edilir (`tail`/pipe üzerinden DEĞİL, D-143'ün dersi). `scripts/gen-a3-fixture.ts`'in
yeniden çalıştırılması gerekip gerekmediğini kontrol et (`smartTarget` fixture'ın beş gerçek
yönteminden biri — muhtemelen gerekecek).

Kapanışta belgeler: `TEMPLATE_ANALYSIS.md` §15'e düzeltme sonucu eklenir (yeni bir alt bölüm,
§15'in kendisi silinmez — bulgu tarihsel kayıt olarak kalır), `DECISIONS.md`'ye yeni bir
D-numarası, P-43 CLOSED, P-26'nın layout yarısı CLOSED, `CLAUDE.md`'ye bir "Oturum D — D2b"
paragrafı, `docs/oturumlar/README.md`'nin satırı güncellenir.

---

**Model önerisi:** Opus — D-28'in kendi routing'i, LOCKED bir görsel tasarımı etkileyen bir
algoritma değişikliği + iki gerçek `AskUserQuestion` tasarım kararı (§2.2/§2.3) için derin akıl
yürütme istiyor; C5'in mimari sorusuyla aynı ağırlıkta. Sonnet üzerinde de çözülebilir (C3/C5
emsali) — yalnızca dosyaları görüp karar ver, önceden varsayma.
