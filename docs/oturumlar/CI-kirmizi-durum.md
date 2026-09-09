# OTURUM — CI kırmızı durumu: kök neden araştırması + düzeltme

> **Bu dosya bir M2 (auto-update, D-238) yan bulgusu olarak yazıldı, 2026-09-09.** M2'nin kendi
> commit'i (`2c2143f`) gerçek CI'de çalıştırılırken — bu proje tarihinde muhtemelen ilk kez bir
> oturum gerçekten `gh run list`/`gh run view` ile GERÇEK GitHub Actions durumuna baktı, yalnızca
> yerel `npm test`/`cargo test`'e güvenmedi — **CI'nin çok daha uzun süredir kırmızı olduğu
> bulundu.** Kanonik konum: `docs/oturumlar/CI-kirmizi-durum.md`.
>
> **Bu bir kapsam-belirleme dosyasıdır — kod henüz YAZILMADI.** §0'daki kanıt gerçek `gh`
> komutlarıyla toplandı, tahmin edilmedi. Sıradaki oturumun kendi ilk işi bu kanıtı yeniden
> doğrulamak (linkler/run ID'leri değişmiş olabilir, yeni commit'ler yeni run'lar demektir) ve
> §3'ün kendi bölme sorusuna karar vermek.

---

## 0. Bulgunun kendisi — gerçek kanıt, tahmin değil

```bash
gh run list --repo ozgurgovem/pps-hachi --limit 100 --json databaseId,conclusion,createdAt,displayTitle \
  --jq '.[] | "\(.databaseId)\t\(.conclusion)\t\(.createdAt)\t\(.displayTitle)"'
```

Bu komutun 2026-09-09'daki çıktısı: **`30719664219` (2026-08-01, "ci: cut Actions cost...") son YEŞİL
run — ondan sonraki HER TEK run (`30817955879`'dan başlayarak, 2026-08-03, "method plugins wave 1
— eight PPS methods (Phase 5)") kırmızı.** Yani Faz 5'ten bu güne (M2'nin kendi commit'i dahil,
2026-09-09) **35+ ardışık commit, 5 haftadan fazla, CI'de tek bir yeşil run yok.** Bu süre boyunca
CLAUDE.md'nin Current State bölümündeki her "npm test N/N, cargo test M/M" satırı gerçek ve
doğru — ama hiçbiri "ve CI de yeşil" demiyor, çünkü hiçbir oturum bunu gerçekten kontrol etmedi.

**İki bağımsız, birbirinden farklı kök nedenli kırmızı var** — aynı bulgu değiller, aynı düzeltme
onları ikisini birden kapatmaz:

### 0.1 — macOS: `E2E test (AI off happy path)` — DETERMİNİSTİK, her run'da başarısız

İlk başarısız run, E2E suite'in ilk kez eklendiği commit'in kendisi:
```bash
gh run view 33341344079 --repo ozgurgovem/pps-hachi   # Faz 8 Dilim 3, 2026-08-30 — İLK E2E run
```
macOS job'ı `E2E test (AI off happy path)`'te başarısız — bu run dahil, sonrasındaki HER TEK run
aynı adımda başarısız (`gh run view 34398576803` — M2'nin kendi commit'i — dahil, en son
doğrulanan örnek). Gerçek hata (M2'nin kendi run'ından, `gh run view 34398576803 --log-failed`):

```
2 passing (1m 16.1s)
4 failing

1) AI kapalı mutlu yol (D-20) creates a new project with no AI step in the way
   element ("h1*=e2e-test-project") still not displayed after 15000ms
2) AI kapalı mutlu yol (D-20) adds a generic-text entry in every one of the 8 steps
   Can't call click on element with selector "button[aria-label^="Step 1:"]" because element wasn't found
3) AI kapalı mutlu yol (D-20) renders the A3 preview without error
   Can't call isEnabled on element with selector "button*=Export A3" because element wasn't found
4) AI kapalı mutlu yol (D-20) exports a real .xlsx file to disk
   Can't call click on element with selector "button*=Export A3" because element wasn't found
```

**Desen açık: test 1 ("shows the launch screen") ve test 6 ("never shows the Assistant tab")
geçiyor — ikisi de gerçek bir "New Project" ak(ış)ına hiç girmiyor. Test 2'den itibaren HER ŞEY
tek bir noktada kilitleniyor: "New Project" tıklandıktan sonra proje ekranı (`h1*=<proje-adı>`)
15 saniye içinde hiç görünmüyor — sonraki 3 test bunun kademeli sonucu (state hiç oluşmadı).**

Bu, **P-49**'un (Faz 8 Dilim 3, D-202) kendi "honestly unverified" notuyla birebir örtüşüyor:
> "`tauri-plugin-wdio`'nun kendi dokümanı mock'unun `window.__TAURI__.core.invoke`'u
> intercept ettiğini anlatıyor... bu uygulama `invoke()`'u `@tauri-apps/api/core` ESM import'uyla
> çağırıyor... aynı intercept'in gerçek bir UI tıklamasından gelen `invoke()` çağrısını da
> yakalayıp yakalamadığı hiç doğrulanmadı." — **Bu oturumun kendi kanıtı P-49'un şüphesini
> doğruluyor gibi görünüyor**: mock'lanan `save()` diyaloğu (`browser.tauri.mock("plugin:dialog|save")`)
> gerçek "New Project" düğmesinin tetiklediği `invoke()` çağrısını YAKALAMIYOR olabilir — path hiç
> dönmüyor, `handleConfirmLanguage`/`createProjectAtPath` hiç çalışmıyor, proje hiç açılmıyor.
> **Ama bu bir HİPOTEZ — sıradaki oturumun kendi ilk işi bunu gerçek log/kaynak okuyarak
> doğrulamak, tahmin üzerine kod yazmamak** (bu dosyanın kendi ruhu, §2).

### 0.2 — Windows: `Frontend tests` — FLAKY, farklı testler farklı run'larda zaman aşımına uğruyor

İlk başarısız run çok daha eski, E2E'den bağımsız:
```bash
gh run view 30817955879 --repo ozgurgovem/pps-hachi   # Faz 5, 2026-08-03 — İLK kayıtlı kırmızı run
```
Bu run'da Windows zaten `Frontend tests`'te başarısız — **E2E suite'in var olmasından 4 hafta
önce**, yani bu iki kırmızı BAĞIMSIZ kökenli. Üç farklı run'da üç farklı semptom görüldü (aynı
kök nedenin — Windows runner'ının macOS'a göre daha yavaş/tıkanık olması — farklı testleri farklı
zamanlarda vurması):
- M2'nin kendi run'ı (`34398576803`): `WorkspaceScreen.test.tsx`'in "the user can create and
  reorder generic-text entries in every one of the 8 steps" testi — **`Error: Test timed out in
  5000ms`** (vitest'in varsayılan `testTimeout`'u). 1574/1575 geçti, yalnızca bu tek test.
- Bir önceki run (`34392099980`, M4 merge): `expected [...] to deeply equal [...]` (dizi
  uzunluk uyuşmazlığı) + `TestingLibraryElementError: Found multiple elements with the text:
  Step 1 note A`.
- Faz 8 Dilim 2'nin kendi run'ı (`33337617115`, E2E'den önce): `Unable to find an element with
  the text: Free text`.

**Her seferinde FARKLI bir test, farklı bir noktada başarısız — tek, deterministik bir bug değil,
Windows CI runner'ının gerçek zaman baskısı altında `waitFor`/varsayılan 5000ms `testTimeout`
sınırına çarpan testler.** 1575 testin neredeyse tamamı her seferinde geçiyor; yalnızca zamanlama
marjı dar olan 1-2 test rastgele hangi testin o an yavaş olduğuna bağlı olarak zaman aşımına
uğruyor. **Hipotez (doğrulanmadı): `vitest.config.ts`'nin global `testTimeout`'u macOS için
yeterli ama Windows GitHub-hosted runner'ları için dar — bir global timeout artışı (ör. 5000 →
10000-15000ms) muhtemelen bunu kapatır, ama körü körüne yapılmamalı — önce gerçekten bir
zamanlama sorunu olduğu (gerçek bir race condition/bug değil) doğrulanmalı.**

---

## 1. Neden şimdiye kadar fark edilmedi

Her oturumun kendi CLAUDE.md kaydı yalnızca **yerel** `npm test`/`cargo test` sonucunu raporluyor
— bu doğru ve gerçek, ama gerçek CI durumunu hiç yansıtmıyordu. `gh run list`/`gh run view` hiçbir
önceki oturumda çalıştırılmamış görünüyor (en azından CLAUDE.md'nin kendi kaydında hiç anılmıyor).
Bu, Anayasa Madde 8'in ("modeli denetle, körü körüne güvenme") tam isabet ettiği bir kör nokta —
"yerel testler yeşil" ve "CI yeşil" iki farklı iddia, biri diğerini kanıtlamıyor.

---

## 2. Sıradaki oturumun kendi ilk işi — gerçek koda/loglara karşı doğrula, tahmin etme

```bash
gh run list --repo ozgurgovem/pps-hachi --limit 10 --json databaseId,conclusion,createdAt,displayTitle
  # Hâlâ kırmızı mı? Hangi commit'ten beri? Bu dosyanın kendi §0'ı hâlâ doğru mu?

gh run view <en-son-run-id> --repo ozgurgovem/pps-hachi --log-failed | grep -A 5 "FAILED\|Error:"
  # Aynı iki desen mi (macOS: New Project akışı kilitleniyor / Windows: rastgele test timeout)?

cat e2e/specs/ai-off-happy-path.spec.ts   # özellikle satır ~40-75, "New Project" akışının
  # mock'landığı ve h1*=<proje-adı>'nin beklendiği kısım
grep -rn "tauri.mock\|__TAURI_INTERNALS__\|__TAURI__" node_modules/@wdio/tauri-service/dist/esm/index.js | head -20
  # tauri-service'in mock mekanizmasının GERÇEKTEN hangi global'i patch'lediğini oku — tahmin etme
grep -n "invoke" node_modules/@tauri-apps/api/core.js | head -10
  # bu uygulamanın gerçekten hangi global'i çağırdığını oku
```

Bunlar P-49'un kendi hipotezini KANITLAMAK ya da ÇÜRÜTMEK için gerekli — bu dosya yalnızca
gözlemi (4/6 test kilitleniyor, hep aynı noktada) kaydediyor, kök nedeni henüz KANITLAMIYOR.

---

## 3. Muhtemel bölme — iki bağımsız kök neden, iki bağımsız düzeltme

Bu iki bulgu birbirinden TAMAMEN bağımsız (biri E2E/WebdriverIO mock mekanizması, diğeri
vitest'in Windows'taki zamanlama marjı) — D-114'ün "bir dilim bir mekanizma" ilkesi burada da
geçerli, muhtemelen iki ayrı oturum/dilim gerekir:

- **CI-A (macOS E2E)** — gerçek araştırma gerektiriyor (mock mekanizmasının gerçekten neyi
  intercept ettiğini kaynak okuyarak anlamak, gerekirse `tauri-plugin-wdio`'nun kendi GitHub
  issue'larına bakmak, gerekirse spec'i veya app'in kendi kod yolunu düzeltmek). Daha büyük,
  daha belirsiz kapsamlı.
- **CI-B (Windows flaky timeout)** — muhtemelen küçük (bir `testTimeout` config değişikliği +
  gerçekten zamanlama sorunu olduğunun doğrulanması, ör. aynı testi Windows'ta arka arkaya birkaç
  kez tetikleyip tutarsız süre alıp almadığına bakarak). Daha küçük, daha bağımsız — muhtemelen
  önce bu yapılır.

Sıradaki oturum, tıpkı L3/M2'nin kendi emsali gibi, bölüp bölmeyeceğine (ya da CI-B'yi önce küçük
bir dilim olarak kapatıp CI-A'yı ayrı bir oturuma bırakıp bırakmayacağına) kendi kararını verebilir
(Anayasa Madde 9) — bu dosya yalnızca kanıtı ve iki-bağımsız-kök-neden yapısını kayda geçiriyor.

---

## 4. Kapsam dışı

- M2'nin kendi gerçek uçtan-uca doğrulaması (bir `v*` tag push'u) — bağımsız, kendi onayını
  bekliyor, bu dosyayla ilgisiz.
- Node.js 20 deprecation uyarısı (her run'da görülüyor, `actions/checkout@v4`/`actions/setup-
  node@v4` Node 24'e zorlanıyor) — zararsız bir uyarı, CI'yi kırmıyor, ayrı, düşük öncelikli bir
  temizlik maddesi.

---

**Model önerisi**: CI-A gerçek bir araştırma + muhtemelen kod değişikliği — Sonnet 5 yeterli.
CI-B küçük, mekanik bir doğrulama+config değişikliği.
