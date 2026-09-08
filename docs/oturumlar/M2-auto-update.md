# OTURUM Faz 12 — M2: Auto-update (GitHub Releases + `tauri-plugin-updater`)

> Faz 12 kapsam belirleme (D-230, 2026-09-08) Barış'a soruldu: auto-update Faz 12'nin içinde mi?
> **Cevap: evet, GitHub Releases üzerinden tam otomatik.** Ama bu seçim kendi başına bir üretim
> engeli doğurdu — repo private (`gh repo view` ile doğrulandı, hâlâ öyle) ve GitHub private
> repo Release asset'leri kimlik doğrulaması gerektirir; kurulu bir uygulamanın gerçek kullanıcı
> makinesinde GitHub token'ı olmayacağı için `tauri-plugin-updater` üretimde 404 verirdi. İkinci
> bir `AskUserQuestion` turunda Barış'ın kararı: **repo public yapılsın.**
>
> **Bu dosyanın kendi ilk gerçek adımı, kodlamadan ÖNCE, repo görünürlüğünü değiştirmenin kendi
> AYRI onayıdır** — D-230 bu kararı KAYDETTİ ama UYGULAMADI (geri-alınması zor, dışarıdan
> görünür bir eylem; "Executing actions with care" ilkesi gereği, kayıtlı bir karar bile
> yürütme anında yeniden teyit ister). §1'in kendi ilk adımı bu.
>
> D-114'ün "dilim başına bir mekanizma" bütçesi burada muhtemelen AŞILIYOR — bu dilim en az üç
> gerçek yeni mekanizma taşıyor (repo görünürlüğü + CI release-publish akışı + frontend
> update-check UI'si + Tauri'nin kendi update-imza anahtarı). Bu oturumun kendi ilk işi, tıpkı
> L3'ün kendi kararı gibi (D-226), bunu ikiye/üçe bölüp bölmeyeceğine KENDİSİ karar vermek —
> Barış'a "böleyim mi" diye sorulabilir ya da Anayasa Madde 9 gereği bilgi yeterliyse doğrudan
> karar verilebilir.
>
> Kanonik konum: `docs/oturumlar/M2-auto-update.md`. Yazıldı: 2026-09-08, Faz 12 kapsam
> belirleme oturumunda (D-230).

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
gh repo view ozgurgovem/pps-hachi --json visibility
  # 2026-09-08'de PRIVATE idi. Hâlâ PRIVATE ise §1 gerçek adımı BEKLİYOR. PUBLIC ise, bu
  # dilim daha önce kısmen başlamış olabilir — DECISIONS.md'de bir D-numarası ara, kontrol et.

grep -n "updater\|tauri-plugin-updater" src-tauri/Cargo.toml src-tauri/tauri.conf.json package.json
  # HİÇBİR eşleşme bekleniyor — henüz kurulmadı.

grep -n "^tauri = \|^tauri-plugin-" src-tauri/Cargo.toml
  # Mevcut plugin deseni: tauri-plugin-opener = "2", tauri-plugin-dialog = "2.7.2" — yeni
  # `tauri-plugin-updater` bu ikisinin AYNI deseniyle eklenir.

python3 -c "import json; d=json.load(open('src-tauri/tauri.conf.json')); print(d.get('version'))"
  # 2026-09-08'de "0.1.0" idi — release tetikleme mekanizması (git tag mi, version bump mı)
  # bu alana bağlı olacak, kontrol et.

sed -n '1,120p' .github/workflows/ci.yml
  # D-44'ün kendi mevcut yapısı: plain `npm run tauri build` + `actions/upload-artifact`,
  # `TAURI_SIGNING_PRIVATE_KEY=""` ile bilinçli imzasız. Bu dosyanın YANINA (üzerine değil) bir
  # release-publish akışı eklenecek, çünkü normal push/PR CI'si D-44'ün kendi gerekçesiyle
  # (her push'ta release oluşturulmasın) DEĞİŞMEMELİ.
```

`DECISIONS.md`'de **D-44** (CI'nin unsigned bundle gerekçesi, bu dilimde revisit tetiklendi),
**D-46** (repo görünürlüğü kararı, bu dilimin kendi ilk adımı), **D-230**'un (Faz 12 kapsam
belirleme) tam metnini oku.

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. İlk gerçek adım — repo görünürlüğü (kod DEĞİL, onaylı bir altyapı eylemi)

Kodlamadan önce Barış'a AÇIKÇA doğrula (D-230'un kaydettiği kararı hatırlatarak, körü körüne
yürütmeden): "D-230'da repo'yu public yapmaya karar verdin — şimdi `gh repo edit
ozgurgovem/pps-hachi --visibility public` çalıştırayım mı?" Onay gelmeden çalıştırma. Onay
gelince çalıştır, `gh repo view` ile doğrula, `DECISIONS.md`'nin D-46 satırını "OPEN" → ilgili
notla güncelle (bu artık geri alınmış/uygulanmış bir karar).

**Neden bu kadar törensel:** bir private repo'yu public yapmak kaynak kodu (ve bu dosyanın
kendisi dahil tüm DECISIONS.md/CLAUDE.md iç tartışma geçmişini) herkese açık hale getirir —
"Executing actions with care" ilkesinin tam olarak uyardığı sınıf bir eylem.

---

## 2. Gerçek açık sorular — kodlamadan önce Barış'a sorulmalı

Faz 12 kapsam oturumu yalnızca "auto-update var mı yok mu, hangi kanal" sorusunu sordu — BU
dilimin kendi mekanik detayları hiç sorulmadı:

1. **Release tetikleme** — bir GitHub Release ne zaman oluşur? Adaylar: (a) `git tag vX.Y.Z`
   push edildiğinde (`AKIS.md` §4'ün zaten kurduğu tag-etme disiplinine uyar), (b) manuel
   `workflow_dispatch`, (c) `tauri.conf.json`'daki `version` alanı değiştiğinde otomatik. D-44'ün
   kendi gerekçesi ("her push'ta release istenmiyor") hangi seçilirse seçilsin KORUNMALI —
   normal `main` push'u/PR'ı asla yeni bir Release oluşturmamalı.
2. **CI mekanizması** — `tauri-apps/tauri-action`'ı (D-44'ün bilerek KAÇINDIĞI araç) yalnızca
   yukarıdaki tetikleyiciyle sınırlı bir AYRI job'da mı kullan, yoksa mevcut plain-build +
   `gh release create --generate-notes` gibi elle bir adım mı ekle? `tauri-action`
   `latest.json` üretimini/yüklemesini otomatik yapar — bunu elle yeniden inşa etmek gereksiz
   risk taşır, muhtemelen doğru cevap "sınırlı tetikleyicili tauri-action" ama bu Barış'a
   sorulmalı, körü körüne varsayılmamalı.
3. **Update-check UX** — sessiz arka plan kontrolü (uygulama açılışında, kullanıcıya yalnızca
   yeni sürüm VARSA bir bildirim) mü, yoksa Settings'te yalnızca elle "Güncellemeleri kontrol
   et" düğmesi mü, yoksa ikisi birden mi? SPEC'in kendi lafzı "auto-update" diyor ama bunun
   "otomatik indirir ve kurar" mı yoksa "otomatik KONTROL eder, kullanıcı onaylar" mı anlamına
   geldiği netleşmeli — D-15/D-16'nın "AI önerir, insan onaylar" felsefesiyle aynı desenin
   burada da (güncelleme kurulumunda) geçerli olup olmadığı gerçek bir soru.
4. **`pubkey`/imza anahtarı yönetimi** — `tauri signer generate` ile üretilen private key nerede
   saklanacak (GitHub Actions secret, adı ne), public key `tauri.conf.json`'a mı yoksa ayrı bir
   dosyaya mı gömülecek? Bu, D-44/D-46'nın kod-imzalama kararından TAMAMEN BAĞIMSIZ bir
   mekanizma (Tauri'nin kendi minisign tabanlı update-imza şeması, ücretsiz, Apple Developer
   Program/Windows EV sertifikasıyla ilgisi yok) — bu ayrım kod yazılırken TypeScript/Rust
   tarafında bir yorum satırıyla açıkça belirtilmeli, gelecekte biri "zaten imzasız kalacaktık"
   diyip bu mekanizmayı da atlamasın diye.

---

## 3. Beklenen yapı (taslak, kesin değil — yukarıdaki sorulara göre değişir)

- **Rust**: `src-tauri/Cargo.toml`'a `tauri-plugin-updater = "2"`; `tauri.conf.json`'a
  `plugins.updater` (endpoint(ler), `pubkey`); `lib.rs`'e plugin init (mevcut
  `tauri-plugin-dialog`/`tauri-plugin-opener` deseninin AYNISI).
- **TypeScript**: `@tauri-apps/plugin-updater` + `@tauri-apps/plugin-process` (yeniden başlatma
  için); Settings ekranına (ya da §2.3'ün cevabına göre başka bir yere) bir "check for updates"
  kontrolü.
- **CI**: mevcut `ci.yml`'e DOKUNULMAZ (D-44'ün kendi gerekçesi hâlâ geçerli normal push/PR
  için); §2.1/§2.2'nin cevabına göre yeni, SINIRLI tetikleyicili bir release job'u (ayrı bir
  workflow dosyası ya da mevcut dosyaya koşullu bir job olarak).

---

## 4. Kapsam dışı

- Kod-imzalama/notarization (M3'ün konusu, D-230'un kararıyla kalıcı olarak imzasız).
- PDF/PNG export (P-65), i18n (M1), Quality floor denetimi (M4) — bağımsız dilimler.
- Repo public yapıldıktan sonra doğabilecek YENİ bir soru — örneğin kaynak kodun herkese açık
  olmasının Farplas'la olan sözleşmesel/gizlilik yükümlülükleri açısından bir sorun olup
  olmadığı — bu KOD sorunu değil, Barış'ın kendi hukuki/iş kararı, bu dilimin kapsamı dışında
  ama §1'in kendi onay adımında bir kez daha hatırlatılmalı.

---

## 5. Bütçe ve kapanış disiplini

§0'ın kendi açılış notu geçerli: bu dilim muhtemelen D-114 bütçesini aşıyor. Bölünürse her
parçanın kendi launch prompt'u yazılır (L3'ün L3a/L3b emsali). Bölünmezse tek oturumda bitirmek
için Anayasa Madde 1'in "bütçe ilk" disiplinini uygula — repo görünürlüğü + tasarım soruları
netleşmeden koda başlama.

Kapanışta: `DECISIONS.md`'ye yeni bir/birkaç D-numarası, D-44/D-46'nın kendi satırlarının
"gerçek uygulama tamamlandı" notuyla güncellenmesi, Faz 12 tablosundaki M2 satırının durumu,
`CLAUDE.md`'nin Current state'ine özet.

---

**Model önerisi**: gerçek bir CI/altyapı tasarımı + kod — Sonnet 5 yeterli (D-28), ama §1'in
kendi onay adımı ATLANMAMALI, model seçiminden bağımsız bir süreç kuralı.
