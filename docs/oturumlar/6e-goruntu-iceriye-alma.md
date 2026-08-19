# OTURUM 6e — Görüntü içe alma + açıklama + 5 görsel-taşıyan yöntem

> D-114'ün beş diliminin **sonuncusu ve en riskli olanı** ("untrusted image bytes from an
> emailed `.ppsx`, the D-64/D-67/D-91/D-92 class"). 6a/6b/6c/6d hepsi bitti (D-149's dört
> oturumluk arayüz planı da tamamen kapandı, bu onunla ilgisiz — bu, `SPEC.md`'nin kendi Faz
> 6 planının beşinci ve son dilimi). Bu oturumla birlikte **Faz 6 tamamen kapanır.**
>
> Kanonik konum: `docs/oturumlar/6e-goruntu-iceriye-alma.md`. Yazıldı: 2026-08-18, Oturum
> 6d'nin kapanışının hemen ardından, Barış'ın açık isteğiyle ("yeni oturum için prompt verir
> misin?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      src/domain/model/entry.ts \
      src/a3/methodContract.ts \
      src/a3/render/rasterize.ts \
      src/methods/registry.ts src/methods/types.ts \
      src/methods/fishbone/index.ts src/methods/fishbone/FishboneDiagram.tsx \
      src-tauri/src/ppsx/archive.rs src-tauri/Cargo.toml \
      package.json
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-18'de doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made" (özellikle EXIF/görüntü satırı: "EXIF data on
   shop-floor photos. Strip it before sending anything to a provider." — bu satır artık
   **eksik**, çünkü D-118 stripping'i AI yoluna değil her `.ppsx`'e bağladı, aşağıda D-118'e
   bak), "Current state"in en üstteki "Phase: 6 of 12" özet satırı (6d'nin kapanışında
   güncellendi, bu oturumun kendi kapanışında son kez güncellenecek) ve en sondaki
   "Oturum 6d" paragrafı (bu dilimin hemen önceki bağlamı).
3. `SPEC.md` §1.3'ün Adım 1 (satır 87-94), Adım 2 (satır 96-111) ve Adım 6 (satır 143-149)
   madde listeleri — **bu dilimin tek doğru kapsam kaynağı, slice özetinden değil satır
   satır türet** (D-137'nin kendi dersi). `SPEC.md` §5 (satır 505-528, teknoloji yığını —
   `image` crate satırı) ve §8.7/§8.11 (satır ~700-790, AI-yolu için ayrı bir downscale/EXIF
   politikası — bu dilimle **karıştırma**, aşağıda §2.2'de ayrım var).
4. `DECISIONS.md`:
   - **D-114** (Faz 6'nın beş diliminin tanımı — 6e: "image ingestion + annotation + the
     five image-bearing methods", en riskli olduğu için son sıraya konuldu).
   - **D-118 — BU OTURUMUN MİMARİ TEMELİ, ZATEN KARARLAŞTIRILDI, YENİDEN TARTIŞMA.**
     "Image ingestion is owned end-to-end by Rust; the webview never sees raw file bytes."
     Dört ayrı karar: (1) bir Tauri dialog bir path döner, Rust dosyayı okur, EXIF
     orientation'ı piksellere uygular, EXIF'i **koşulsuz** siler, küçültür, thumbnail üretir
     (`image` crate), ikisini de aynı `expected_modified_ms` compare-and-swap yoluyla
     (`ppsx_write`'ın kullandığı, D-77) `.ppsx`'e hemen yazar. (2) Frontend yalnızca bir
     `ImageRef` + küçük bir thumbnail alır. (3) `.ppsx`'ten gelen bir görüntü Rust'ta **asla
     yeniden decode edilmez** — saklı thumbnail, webview'in kendi decoder'ına opak byte
     olarak verilir (güvenlik kararı: D-64/D-67/D-91/D-92 sınıfının bir imaj decoder'ıyla
     tekrarı olurdu). (4) `A3ImageRequest` bir kaynak ayırıcı kazanacak (`spec`-kaynaklı =
     grafik, rasterize edilmeli; `asset`-kaynaklı = fotoğraf, byte'lar zaten var);
     `place.ts` ikisi için aynı geometriyi hesaplar, yalnızca composition root'un resolver'ı
     ayrışır. **"Numeric caps ve tam IPC yüzeyi 6e ile geliyor" — yani D-118 mimariyi
     kararlaştırdı, rakamları ve komut imzalarını KARARLAŞTIRMADI, bu oturumun işi.**
   - **D-137** (6c'nin "özetten değil satır satır türet" dersi — bu oturumun kendi
     metodolojisi, §2.1'de tekrar kullanılıyor).
   - **D-138** (6c'nin Gantt'ı, "bir dilimde en fazla bir yeni alt-sistem" kuralı yüzünden
     ertelemesi — bu oturumun kendi §2.3'ündeki bölünme gerginliğinin doğrudan emsali).
   - **D-64, D-67, D-91, D-92** (zip-entry/path-component güvenlik sertleştirmesi —
     `.ppsx`'e görüntü yazan her yeni kod bu disiplini miras almalı, yeniden icat etmemeli).
5. `src/domain/model/entry.ts`'in `ImageRefSchema` (`{id, assetPath, thumbnailPath?}`) ve
   `Entry.images: ImageRef[]` alanı — zaten var, hiçbir arayüz henüz doldurmuyor, doğrula.
6. `src/a3/methodContract.ts`'in `A3ImageRequest`/`A3ImageKind` — şu an yalnızca `spec`-
   kaynaklı (rasterize edilen) türler var (`pareto-chart`, `fishbone-diagram`, …), D-118'in
   "asset-kaynaklı" ayırıcısı **henüz yok**, doğrula.
7. `src/a3/render/rasterize.ts` — mevcut spec→PNG döngüsü; asset-kaynaklı görüntülerin bu
   döngüyü hiç görmemesi gerekiyor (byte'lar zaten var), composition root'ta nasıl bir çatal
   gerekeceğini oku.
8. `src/methods/fishbone/` — en yakın emsal: kendi görsel editörü (React Flow) + kendi
   rasterize edici + kendi A3 export'u olan bir yöntem. Yeni beş yöntemin ikisi (Spaghetti,
   VSM) "image upload + annotation" istiyor — Fishbone'un React Flow deseni açıklama
   katmanı için doğrudan taşınabilir mi, yoksa farklı bir mekanizma mı gerekiyor, oku ve
   karar ver.
9. `src-tauri/src/ppsx/archive.rs` — mevcut zip yazma/okuma sertleştirmesi (D-64/D-67/D-91/
   D-92), yeni `assets/img_{uuid}.png`/`assets/thumb_{uuid}.webp` girişlerinin aynı
   `is_safe_relative_name`/boyut tavanı disiplininden geçmesi gerekiyor — yeniden yazma,
   genişlet.
10. `src-tauri/Cargo.toml` + `package.json` — `image` crate'in henüz eklenmediğini, ve
    frontend'de hiçbir canvas/annotation kütüphanesinin (konva, fabric, vb.) henüz
    bulunmadığını doğrula (2026-08-18'de ikisi de doğrulandı, yeniden kontrol et).

---

## 2. Kapsam

### 2.1 Önce doğrula — beş yöntem gerçekten bunlar mı?

`SPEC.md` §1.3'ün Adım 1/2/6 madde listesini, satır satır, şu an sevk edilen yöntemlere karşı
kontrol et — bu oturumun kendi ön taraması (2026-08-18, `src/methods/*/index.ts`'nin
`steps: [...]` alanlarını tarayarak) şunu buldu, **körü körüne güvenme, kendi taramanı
yap**:

| Adım | SPEC madde | Karşılığı |
|---|---|---|
| 1 | Defect photo board with annotation (arrows, circles, callouts) | **YOK** — 6e'nin |
| 2 | Spaghetti diagram (image upload + annotation) | **YOK** — 6e'nin |
| 2 | Value Stream Map (image upload + annotation) | **YOK** — 6e'nin |
| 2 | Gemba observation log (date, place, observer, what was seen, photos) | **YOK** — 6e'nin |
| 6 | Before / After photo pairs | **YOK** — 6e'nin |

Adım 1/2/6'nın geri kalan tüm maddeleri zaten sevk edilmiş durumda (bu tarama sırasında
doğrulandı) — SQDCM business-impact tagger da dahil, o `tpmLossTaxonomy`'ye dönüştürüldü
(Phase 6a'nın kendi SPEC §3.0 düzeltmesi, yeniden yapma). Action plan'ın Gantt yarısı
(Adım 6) bu beşin **dışında** — P-22/D-138, kendi ayrı dilimine ertelenmiş durumda, bu
oturum ona dokunmaz.

### 2.2 Gerçek açık sorular — kodlamadan önce netleştirilmeli

Dosyaları okuduktan sonra, muhtemel adaylar (kesinleşmez, ama başlangıç noktası):

1. **Saklanan orijinal görüntü + thumbnail için sayısal tavanlar ne?** `SPEC.md` §8.7'nin
   "1568 px long edge" rakamı **AI-transport yolu içindir** (bir sağlayıcıya gönderilmeden
   önce, Phase 8+, henüz başlamadı) — D-118'in "downscale" kelimesi genel ingestion için,
   ayrı bir rakam gerektiriyor ve SPEC hiçbir yerde onu vermiyor. `.ppsx` boyutunun makul
   kalması (D-06: e-postayla gidip gelen bir dosya) ile fotoğraf kalitesi arasında bir denge
   — muhtemelen orijinal için bir üst sınır (ör. 2000-3000 px uzun kenar) + küçük bir
   thumbnail (ör. 400 px), ama bu bir ürün kararı, tahmin etme.
2. **Açıklama (annotation) nasıl saklanıyor — piksellere gömülü mü, vektör overlay mi?**
   İki gerçek seçenek: (a) kullanıcı ok/daire/callout çizer, sonuç **tek bir düzleştirilmiş
   PNG** olarak saklanır (basit — D-118'in "asset-kaynaklı, rasterize gerektirmez" hızlı
   yoluna tam uyar, ama açıklamalar sonradan düzenlenemez); (b) açıklamalar ayrı vektör veri
   olarak saklanır, editörde VE A3 export'ta temel görüntünün üstüne render edilir (daha
   esnek — düzenlenebilir — ama kendi mini-rasterize yolunu gerektirir, D-102'nin grafik
   deseniyle aynı sınıf, yani ikinci bir kanıtlanmamış mekanizma). **Bu, §2.3'ün bölünme
   gerginliğiyle doğrudan bağlantılı.**
3. **Bir entry kaç görüntü taşıyabilir, ve rol nasıl ayırt edilir?** `Entry.images:
   ImageRef[]` zaten bir dizi (D-52) — ama Before/After çiftleri "before" ve "after" rolünü
   ayırt eden bir şey gerektiriyor (muhtemelen `payload` içinde, `ImageRef` üzerinde değil,
   D-52'nin "payload metod-özel" ilkesine uygun); Gemba log "photos" (çoğul, rolsüz) diyor;
   Defect photo board/Spaghetti/VSM muhtemelen tek görüntü + açıklama. Üç farklı şekil —
   hepsini aynı jenerik bileşene mi zorlayacaksın, yoksa yöntem başına mı çözeceksin?
4. **Görüntü yükleme UI'si nerede yaşıyor — jenerik kabuk mu, yöntem-özel mi?** D-125'in
   referans alanı emsali (`EntryReferenceField`, jenerik kabuk UI, hiçbir yöntem kendi
   picker'ını çizmiyor) burada da geçerli mi, yoksa açıklama editörünün kendine özgü
   karmaşıklığı (çizim tuvali) onu yöntem-özel bir `Editor` yapmayı zorunlu mu kılıyor?
   `MethodEditorProps`'un hâlâ yalnızca `{payload, onChange}` taşıdığını unutma (6d'de
   `EntryRoundField` için aynı kısıt karşımıza çıktı) — bir görüntü yükleme komutu Tauri
   IPC'sine gitmesi gerekiyor, ki bu `onChange`'in tek başına karşılayamayacağı bir yan
   etki.

### 2.3 Bütçe gerginliği — muhtemelen bu tek oturumda bitmeyecek

D-114'ün kendi kuralı ("bir dilimde en fazla bir yeni alt-sistem") burada gerilim altında:
**görüntü ingestion mekanizmasının kendisi** (Rust `image` crate + EXIF strip + downscale +
thumbnail + atomic write + yeni Tauri komutu + `A3ImageRequest`'in asset-kaynaklı ayırıcısı)
tek başına zaten bir yeni mekanizma — ve SPEC'in kendi madde metni üçü için **açıklama
(çizim aracı)** da istiyor, ki bu **ikinci**, kanıtlanmamış bir frontend mekanizması
(bu depoda hiçbir canvas/çizim kütüphanesi yok, 2026-08-18'de doğrulandı). D-138'in Gantt'ı
6c'den ayırma gerekçesi ("iki kanıtlanmamış mekanizma tek dilimde asla debug edilmez —
D-105/D-113'ün çıktığı tam o başarısızlık şekli") burada da birebir geçerli.

**Kodlamaya başlamadan önce, dosyaları gördükten sonra, `AskUserQuestion` ile netleştir**
(önerilmiş bir varsayılan var ama kesin değil):

- **Önerilen bölünme:** 6e-1 bu oturumda — ingestion mekanizmasının kendisi (Rust komutu,
  `ImageRef` yazma, `A3ImageRequest`'in asset yarısı) + açıklama **gerektirmeyen** iki
  yöntem (Gemba observation log, Before/After photo pairs — SPEC'in kendi metni ikisinde de
  "annotation" kelimesini kullanmıyor, düz fotoğraf ekleme yeterli). 6e-2 ayrı, temiz bir
  oturumda — çizim aracı mekanizması + açıklama gerektiren üç yöntem (Defect photo board,
  Spaghetti diagram, VSM).
- **Alternatif:** hepsini bu oturumda dene, büyüklüğü gerçek dosyaları görünce yeniden
  değerlendir (Oturum D1'in "kapsam ~2 kat büyüdü, yine de tek oturumda bitir" emsali gibi
  — ama D1'in büyümesi aynı sınıf işti, çeviri; burada iki farklı mekanizma var, emsal tam
  oturmuyor).

Barış'ın seçimi ne olursa olsun, TDD zorunlu: her yeni mekanizma için önce test, KIRMIZI
kanıtlanır, sonra düzeltilir — özellikle Rust tarafı (EXIF strip'in gerçekten çalıştığını,
zip-entry adlarının D-64/D-67 disiplinini miras aldığını, boyut tavanlarının D-67/D-78 gibi
gerçek byte'lara karşı zorlandığını, deklare edilen boyuta değil).

### 2.4 Kapsam dışı

- **Action plan'ın Gantt yarısı** (Adım 6) — P-22/D-138, kendi ayrı dilimi, bu oturum
  dokunmaz.
- **AI-transport yolunun kendi görüntü politikası** (§8.7 — 1568 px, sağlayıcıya gönderim
  öncesi ayrı bir downscale) — Phase 8+, henüz başlamadı, bu oturumun downscale/EXIF
  kararlarıyla karıştırılmamalı (D-118 bunu zaten ayırt etti: "EXIF always, not just before
  a provider call").
- **`pps-8step-auto` şablonu / §12.8'in elastik tahsis modeli** — D-95/D-186, Faz 11.

---

## 3. Bütçe ve kapanış disiplini

Bu, D-114'ün beş diliminin **en büyük risk yüzeyi** — güvensiz byte'lar (D-06: e-postayla
gelen bir `.ppsx`), yeni bir Rust bağımlılığı, yeni bir IPC yüzeyi, muhtemelen yeni bir
frontend çizim mekanizması. Açılışta kaba bir tahmin ver (Anayasa Madde 1); §2.3'ün
bölünme sorusu netleşmeden mekanizmanın kodlanmasına başlanmaz. Sorular netleşince plan
Barış'a kısaca sunulur (`CLAUDE.md`'nin "write a short plan and let me approve it" kuralı).

Rust tarafı için: yeni zip-entry yazma kodu, D-64/D-67/D-91/D-92'nin kurduğu disiplini
(allowlist path-component kontrolü, deklare edilen değil gerçek byte sayımı, atomic write)
miras almalı — yeniden icat edilmemeli. Görüntü decode'unun **yalnızca** yeni yazılan
dosyalar için Rust'ta olduğunu, bir `.ppsx`'ten okunan görüntünün asla Rust'ta yeniden
decode edilmediğini (D-118'in kendi güvenlik kararı) bir testle kanıtla, sadece yorumla
belirtme.

Kapanışta: `npm test`/`npm run lint`/`npm run build` ve `cargo test`/`cargo clippy`/
`cargo fmt` hepsi yeşil — `npm test`'in **exit code**'u ayrı bir logfile + `echo $?` ile
kontrol edilir (`tail`/pipe üzerinden DEĞİL, D-143'ün dersi). `scripts/gen-a3-fixture.ts`'in
yeniden çalıştırılması gerekip gerekmediğini kontrol et — muhtemelen gerekir, çünkü
`A3ImageRequest`'in kaynak ayırıcısı `src/a3/methodContract.ts`'in şeklini değiştirecek.

Kapanışta belgeler: `DECISIONS.md`'ye yeni D-numarası/numaraları (D-118'in mimari kararının
üstüne inşa eden, ona çelişmeyen), `CLAUDE.md`'nin "Current state"ine bir "Faz 6e" paragrafı
(ve en üstteki "Phase: 6 of 12" özet satırının **"Phase 6 tamamen bitti"** olarak
güncellenmesi — D-114'ün beş dilimi tamamlanmış olacak), `docs/oturumlar/README.md`'ye bu
dilimin satırı (ve bölünürse 6e-1/6e-2 olarak ikiye).

---

**Model önerisi:** Opus — bu dilim D-28'in kendi routing kuralının hedeflediği tam profil:
güvenlik-hassas (güvensiz byte'lar, yeni bir decode yolu), yeni bir Rust bağımlılığı,
muhtemel yeni bir frontend mekanizması, ve §2.3'ün kendisi gerçek bir mimari bölünme kararı.
6d'nin aksine burada "düşük riskli, hızlı onaylanan sorular" örüntüsü baştan beklenmiyor —
dosyaları görüp karar ver, ama varsayılan Sonnet değil Opus olsun.
