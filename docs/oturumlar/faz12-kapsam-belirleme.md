# OTURUM Faz 12 — kapsam belirleme

> `SPEC.md` §6'nın kendi faz tablosundaki SONUNCU faz: "Polish, i18n TR/EN complete, PDF/PNG
> export, packaging, signing, auto-update. Done when: Signed installers for both platforms."
> Faz 8/9/10/11'in dördü de kendi kapsam-belirleme oturumuyla başladı (`faz8-kapsam-belirleme.md`,
> `faz9-kapsam-belirleme.md`, `faz10-kapsam-belirleme.md`, `faz11-kapsam-belirleme.md`) — bu
> dosya aynı yöntemi izliyor: **kod yok**, gerçek kod tabanına karşı bir ön-tarama + Barış'a
> `AskUserQuestion` ile sorulacak gerçek açık soruları + önerilen bir dilim planı.
>
> Kanonik konum: `docs/oturumlar/faz12-kapsam-belirleme.md`. Yazıldı: 2026-09-08, W3'ün
> kapanışında, Barış'ın "sıradaki iş" sorusuna cevaben.

---

## 0. İlk iş — gerçek koda karşı doğrula

Bu dosya derinlemesine bir kod incelemesi olmadan, yalnızca birkaç hızlı grep'le yazıldı —
D-137'nin kendi dersi (bu proje boyunca defalarca doğrulandı): bir slice özetine güvenme,
gerçek koda bak.

```bash
grep -rln "pdf\|Pdf\|PDF" src src-tauri/src --include="*.ts*" --include="*.rs" | grep -iv test
  # HİÇBİR üretim dosyası bekleniyor — PDF export hiç inşa edilmedi.

grep -rln "toPng\|exportPng\|png-export" src --include="*.ts*" | grep -iv "test\|rasterize\|render"
  # `rasterize.ts`'in kendi iç `toPng` çağrısı (chart rasterizasyonu, D-102) HARİÇ, ayrı bir
  # kullanıcıya-yönelik "export sheet as PNG" akışı bekleniyor MI diye kontrol et — muhtemelen yok.

grep -n "notarytool\|codesign\|tauri signer\|TAURI_SIGNING" src-tauri/tauri.conf.json .github/workflows/*.yml
  # D-44'ün kendi notu: CI şu an İMZASIZ bundle üretiyor (plain `tauri build` +
  # `upload-artifact`). İmzalama/notarization altyapısı henüz YOK.

grep -n "updater\|auto-update\|tauri-plugin-updater" src-tauri/Cargo.toml src-tauri/tauri.conf.json
  # HİÇBİR eşleşme bekleniyor — auto-update mekanizması hiç kurulmadı.

find src/i18n/locales -name "*.json" | xargs -I{} sh -c 'echo {}: $(python3 -c "import json;print(len(json.load(open(\"{}\"))))")'
  # tr/common.json ve en/common.json'ın üst-seviye anahtar sayısı eşit mi diye kaba bir kontrol
  # (gerçek eksik-anahtar taraması için i18next'in kendi debug modu ya da bir script gerekir —
  # bu dilimin kendi işi, burada değil).

~/.claude/tools/kontrol-dil.sh . --oz-test
  # D10'un mekanik yarısının (yalnızca D10.1-D10.3, kısmen) hâlâ sağlam olduğunu doğrula —
  # bu dilim muhtemelen bu betiği gerçek bir taramada ÇALIŞTIRACAK (Faz 12'nin "i18n TR/EN
  # complete" done-koşulunun bir parçası).
```

`SPEC.md` §6'nın Faz 12 satırını ve §5'i (Apple/Windows gönderim, `APPLE-GONDERIM.md`'nin kendi
iki profili — D11/D12/D13, `~/.claude/APPLE-GONDERIM.md`) baştan sona oku. `DECISIONS.md`'de
**D-44** (CI imzasız, OPEN), **D-46** (kişisel private repo, org yok, OPEN), **P-12** (Windows
AppLocker/WDAC — gerçek bir kurumsal makine olmadan bu ortamdan kapatılamadı, hâlâ açık) —
bunların HANGİLERİ Faz 12'nin kendi kapsamına giriyor, hangileri Barış'ın kendisinin fiziksel
olarak yürümesi gereken SÜREÇ maddeleri (Anayasa Bölüm 4'ün üç-kap ayrımı) netleştirilmeli.

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` — her oturum, istisnasız. Bu oturum kod YAZMIYOR (kapsam belirleme),
   bu yüzden `AKIS.md` teknik olarak zorunlu değil, ama Faz 8-11'in dördü de yine de okudu —
   aynı disiplin.
2. `SPEC.md` §6 (faz tablosu, özellikle Faz 12 satırı) + §5 (mağaza/imzalama gereksinimleri,
   varsa).
3. `~/.claude/APPLE-GONDERIM.md` — D11+D12+D13'ün SÜREÇ yarısı, iki dağıtım profili ([AS]/[DID]).
   Bu dosya Faz 12'nin "signed installers" done-koşulunun ne kadarının KOD (bu oturumun işi) ve
   ne kadarının SÜREÇ (Barış'ın kendi hesabıyla fiziksel yürüyüş) olduğunu ayırmaya yardımcı olur.
4. `DECISIONS.md`: **D-44** (CI'nin imzasız bundle stratejisi, OPEN — ne zaman "revisit"
   edilecek diye kendi notu var), **D-46** (repo kişisel/private, org yok, OPEN), **P-12**
   (Windows AppLocker/WDAC — gerçek makine gerektiriyor, bu ortamdan kapatılamaz).
5. `src/i18n/locales/{tr,en}/common.json` — Faz 12'nin "i18n TR/EN complete" lafzının gerçekte
   ne anlama geldiğini netleştirmeden önce, bugünkü kapsamın ne kadarının zaten TR+EN birlikte
   eklendiğini (CLAUDE.md'nin kendi "TR and EN keys are added together" kuralı, her fazda
   tutarlı uygulanmış görünüyor) doğrula — muhtemelen gerçek eksik yalnızca `~/.claude/
   tools/kontrol-dil.sh`'ın D10.4-D10.9'unun (elle, hiç betiğe çevrilmemiş) hiç sistematik
   olarak yürünmemiş olması.
6. `.github/workflows/*.yml` — CI'nin bugünkü gerçek şekli (D-44/D-46'nın betimlediği).
7. `src-tauri/tauri.conf.json` — bundle/imza/updater alanlarının bugünkü (muhtemelen boş/
   varsayılan) durumu.

---

## 2. Kapsam

### 2.1 Gerçek açık sorular — Barış'a `AskUserQuestion` ile sorulmalı

Faz 12, SPEC'in kendi lafzında BEŞ ayrı iş kalemini tek satıra sıkıştırıyor (polish, i18n
complete, PDF/PNG export, packaging, signing, auto-update — aslında altı). Faz 8-11'in hepsi
kendi kapsam oturumunda BÜYÜK bir SPEC satırını gerçek, ayrı dilimlere böldü (Faz 8: 3 dilim,
Faz 9: 3, Faz 10: 4, Faz 11: 3) — Faz 12 muhtemelen bundan daha fazla ayrışacak, çünkü altı
kalemin çoğu birbirinden TAMAMEN bağımsız (i18n taraması PDF export'a hiç bağımlı değil, PDF
export packaging'e bağımlı değil, vb.). Kodlamadan önce sorulmalı:

1. **PDF export — gerçek bir ihtiyaç mı, yoksa xlsx zaten yeterli mi?** SPEC'in kendi lafzı
   "PDF/PNG export" diyor ama done-koşulu ("Signed installers") bunu hiç doğrulamıyor — Barış'ın
   gerçek kullanım senaryosunda (Farplas'ın kalite mühendisleri) PDF gerçekten mi isteniyor, yoksa
   Excel dosyasının kendisi (zaten Faz 4'ten beri var) PDF'e "Excel'den yazdır" ile mi
   dönüştürülüyor bugün? Eğer ikincisiyse, bu iş kalemi tamamen düşebilir ya da minimal bir
   "Rust'tan headless bir PDF üret" mekanizmasına indirgenmez.
2. **Packaging/signing — hangi profil önce?** `APPLE-GONDERIM.md`'nin iki profili ([AS] App
   Store, [DID] Developer ID doğrudan) farklı maliyetler taşıyor (Apple Developer Program
   üyeliği, notarization akışı) — Windows tarafında da benzer bir ayrım (Microsoft Store vs.
   doğrudan imzalı .exe/.msi) var mı? D-44'ün "revisit once a real release process exists"
   notu — o zaman şimdi mi geldi?
3. **Auto-update — gerçekten Faz 12'nin kapsamında mı, yoksa "v1 çıkana kadar erteleniyor" mu?**
   Bir güncelleme mekanizması (tauri-plugin-updater) kurmak, bir güncelleme SUNUCUSU/dağıtım
   noktası gerektirir — bu, "yalnızca kod yaz" sınırının dışına taşıp gerçek altyapı kararları
   (nerede barındırılacak, kim imzalayacak) gerektirebilir. Barış'ın bunu Faz 12'nin İÇİNDE mi
   yoksa "v1 sonrası" bir P-numarasına mı ertelemek istediği sorulmalı.
4. **i18n "complete" — ölçülebilir bir hedef ne?** `kontrol-dil.sh`'ın D10.1-D10.3'ü mekanik,
   D10.4-D10.9 elle — Faz 12'nin done-koşulu "her string'in TR+EN'de olduğu" kadar basit mi,
   yoksa Türkçe yerelleştirmenin kendi kalite barı (tarih/sayı biçimlendirme, sıralama, Türkçe
   karakter tuzakları — CLAUDE.md'nin kendi tekrarlanan uyarısı) sistematik bir taramayı mı
   gerektiriyor?
5. **"Polish" — somut bir liste mi, yoksa açık uçlu bir kalem mi?** SPEC'in kendi lafzı çok
   genel. Bu proje boyunca birikmiş P-numaralı bulgular arasında gerçekten "polish" sınıfına
   giren var mı (örn. P-58 — Farplas görsel dilinin uygulamanın geri kalanına yayılması — bu
   Faz 12'nin İÇİNE mi alınmalı, yoksa kendi bağımsız oturumu olarak mı kalmalı — bkz.
   `docs/oturumlar/P58-gorsel-dil-yayilmasi.md`, bağımsız yazıldı, bu ikisi arasındaki ilişki
   Barış'a sorulmalı)?

### 2.2 Muhtemel dilim adayları (kesin bölünme değil, bir taslak)

- **i18n tam tarama** — muhtemelen en küçük, en bağımsız dilim; `kontrol-dil.sh`'ın kapsamadığı
  TS/JS/Rust kısmını elle tara, eksikleri kapat.
- **PDF/PNG export** (madde 2.1.1'in cevabına göre var olabilir/olmayabilir) — muhtemelen
  Rust tarafında yeni bir mekanizma (`rust_xlsxwriter`'ın kendisi PDF üretmiyor, ayrı bir
  yaklaşım gerekir — örn. headless bir dönüştürücü, ya da xlsx'i zaten üreten koddan bağımsız
  bir PNG rasterizasyonu, D-102'nin kendi `rasterize.ts`'ine benzer ama farklı bir kullanım).
- **Packaging + signing** — SÜREÇ ağırlıklı, kod tarafı büyük ölçüde `tauri.conf.json`
  yapılandırması + CI güncellemesi; asıl iş Barış'ın kendi hesabından (Apple Developer,
  Microsoft) fiziksel yürüyüş.
- **Auto-update** (madde 2.1.3'ün cevabına göre var olabilir/olmayabilir).
- **P-58'in Faz 12'ye dahil edilip edilmeyeceği** — madde 2.1.5'in cevabına göre.

---

## 3. Kapsam dışı

- Gerçek kod YAZILMAZ bu oturumda — yalnızca tarama + `AskUserQuestion` + dilim planı.
- `farplas-7step-plus`/`farplas-7step-en` (P-62) — ayrı, bağımsız bir kapsam oturumu zaten
  yazıldı (`docs/oturumlar/P62-kalan-sablonlar-kapsam.md`).
- `BenefitCase`/`Onay formu` (P-18) — P-62'nin kendi kapsam oturumuna dahil değil, Faz 12'ye de
  değil, kendi ayrı bir gelecekteki kapsam oturumunu bekliyor (D-223'ün kendi notu).

---

## 4. Bütçe ve kapanış disiplini

Faz 8-11'in dördünün de kendi kapsam oturumu **kod yazmadan** bitti — yalnızca `AskUserQuestion`
turları + `DECISIONS.md`/`docs/oturumlar/README.md`/`CLAUDE.md` güncellemesi + her onaylanan
dilim için kendi launch prompt'u. Bu oturum da aynı disiplini izlemeli — Anayasa Madde 1'in
"bütçe ilk" ilkesi burada özellikle geçerli, çünkü Faz 12 SPEC'in kendi en az netleşmiş
satırı ve gerçek işe girmeden önce doğru bölünmemesi hâlinde G1 (bütçesiz büyük iş) riski
yüksek.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bu oturum başladığında gerçek bir sonraki
numarayı doğrula), `docs/oturumlar/README.md`'ye yeni bir "Faz 12" bölümü, `CLAUDE.md`'nin
"Current state"ine özet, ve onaylanan her dilim için kendi launch prompt dosyası.

---

**Model önerisi**: kapsam belirleme turu (D-28'in routing ilkesine göre) Sonnet 5 yeterli —
Faz 8-11'in dördü de aynı model sınıfıyla yapıldı, burada farklı bir gereksinim yok.
