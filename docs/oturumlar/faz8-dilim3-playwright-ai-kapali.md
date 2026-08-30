# OTURUM Faz 8 — Dilim 3: Playwright altyapısı + "AI kapalı" mutlu-yol testi

> Dilim 1 (`faz8-dilim1-vorion-temel.md`) **BİTTİ** 2026-08-30 (D-200). Dilim 2
> (`faz8-dilim2-vorion-streaming.md`) **BİTTİ** 2026-08-31 (D-201) — Vorion streaming
> completion, Assistant sohbet paneli, provenance plumbing artık gerçek. Faz 8'in üç
> diliminden ikisi bitti.
>
> **Bu dosya Dilim 3'ün kapsamıdır**: D-20'nin Gün-1'den beri LOCKED ama hiç
> uygulanmamış kuralı — "the app is fully functional with AI off... verified by a
> Playwright suite that runs the whole happy path with no keys configured." Bu dilim
> Vorion'dan bağımsızdır; Dilim 1/2'nin bitmiş olması bir önkoşul değildi, yalnızca
> D-199'un üç dilimlik planında üçüncü sırada listelenmişti.
>
> Kanonik konum: `docs/oturumlar/faz8-dilim3-playwright-ai-kapali.md`. Yazıldı:
> 2026-08-31, Dilim 2'nin kapanışının hemen ardından, Barış'ın isteğiyle.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md package.json \
      src-tauri/tauri.conf.json \
      docs/oturumlar/faz8-kapsam-belirleme.md \
      docs/oturumlar/faz8-dilim1-vorion-temel.md \
      docs/oturumlar/faz8-dilim2-vorion-streaming.md \
      .github/workflows/ci.yml
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle**. Ayrıca şunu da doğrula —
**bunlar HÂLÂ yok olmalı** (varsa prompt eski demektir, birisi bu boşluğu zaten
kapatmış olabilir):

```bash
grep -i "playwright" package.json   # eşleşme BEKLENMİYOR
find . -maxdepth 2 -iname "playwright.config.*" 2>/dev/null   # BOŞ BEKLENİYOR
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-20** (LOCKED, Gün-1: "AI kapalıyken de tam işlevsel, bunu
   doğrulayan bir Playwright suite'i yeşil kalmalı"), **D-199** (üç dilimlik plan —
   bu dilimin Vorion'dan bağımsız olduğunu doğrulayan kısım), **D-200/D-201** (Dilim
   1/2 — AI artık kısmen bağlı: bir Settings ekranı, bir keychain, bir Assistant
   sekmesi var; bu dilimin testi bunların HİÇBİRİNİN "AI kapalı" yolunu bozmadığını
   kanıtlamalı, ama kendisi onlara dokunmuyor).
3. `SPEC.md` §9 — iki kabul testi de oku: birinci (temel, AI'dan bağımsız — "8 adım,
   en az 3 metod, 6 fotoğraf, 2 Pareto, export, başka makinede aç") ve ikinci (AI
   açık — bu dilimin kapsamı DIŞINDA, yalnızca bağlamı anlamak için). `SPEC.md`
   satır 560–562 (Faz 8-10 tablosunun hemen altı): D-20'nin tam cümlesi.
4. `docs/oturumlar/faz8-kapsam-belirleme.md` §9.5 (Playwright altyapısının o
   oturumda "HİÇ YOK" olarak bulunduğu tarama) ve §soru-4 (bu dilimin kendi
   kapsamının ilk taslağı, H5 olarak adlandırılmıştı).
5. `.github/workflows/ci.yml` — mevcut CI'ın macOS+Windows runner'larında ne
   çalıştırdığını gör (D-46/D-44'ün "plain build+upload-artifact" kararı) — bu
   dilimin E2E adımı buraya nasıl ekleneceğine kendi kararını verecek.
6. **Tauri v2'nin güncel, resmi E2E test dokümantasyonu** — `tauri.app`'in kendi
   sitesinden, WebFetch ile, **bu oturumda çekilmiş** güncel içerik. Hafızadan
   yazma — §2.1'in kendi açık sorusu bunun üzerine kurulu.

---

## 2. Kapsam

### 2.1 Açık soru — KODLAMADAN ÖNCE araç seçimi doğrulanmalı

**`SPEC.md`'nin lafzı "Playwright" diyor, ama bu muhtemelen Gün-1'de (2026-08-01,
Faz 0'dan bile önce) Tauri'nin gerçek E2E ekosistemi hiç araştırılmadan yazılmış bir
sözcük.** Tauri v2'nin resmi E2E test yolu `tauri-driver` — W3C WebDriver protokolünü
konuşan bir sunucu, üzerine WebdriverIO veya Selenium bindings ile sürülüyor.
Playwright'ın kendisi native olarak W3C WebDriver protokolünü konuşmuyor (Chrome
DevTools Protokolü ve kendi Firefox/WebKit protokollerini kullanıyor) — yani
"Playwright ile Tauri'yi gerçekten sür" doğrudan resmi bir yol OLMAYABİLİR. Bu,
Vorion'un "üç sağlayıcı" varsayımının SPEC'te yanlış çıkmasıyla aynı sınıf bir
durum: **bu oturum önce gerçek, güncel Tauri dokümantasyonunu okumalı, sonra karar
vermeli — SPEC'in sözcüğünü sorgusuz kabul etmemeli.**

Araştırılması gerekenler (WebFetch, güncel `tauri.app` dokümantasyonundan):
- `tauri-driver` + WebdriverIO/Selenium hâlâ resmi/güncel mi, Tauri v2 ile uyumlu mu
- Playwright'ın Tauri desteği var mı — resmi değilse bile topluluk paketleri/
  patternleri var mı, ne kadar olgun
- macOS + Windows'ta `tauri-driver`'ın gerçek kurulum/CI maliyeti ne (native
  WebDriver sürücüleri — `WebKitWebDriver`/`msedgedriver` — gerekiyor mu)

Araştırma bittikten sonra, gerçek bir mimari karar — Barış'a `AskUserQuestion` ile
en az üç seçenek sunulmalı, hiçbiri baştan varsayılmadan:

- **Seçenek A — `tauri-driver` + WebdriverIO/Selenium (Tauri'nin resmi yolu).**
  Gerçek derlenmiş app'i sürüyor (gerçek Rust backend, gerçek dosya yazma, gerçek
  keychain-YOK-durumu), D-20'nin lafzına en sadık test. Bedeli: SPEC'in "Playwright"
  sözcüğünden sapma (SPEC güncellenmeli, `Playwright (e2e)` satırı düzeltilmeli) +
  yeni bir test framework'ü + CI'da native WebDriver sürücü kurulumu.
- **Seçenek B — Playwright, Vite dev server'ına karşı, Tauri IPC'si (`invoke`) JS
  katmanında mock'lanmış.** SPEC'in sözcüğüne sadık, Vitest'in zaten yaptığı
  mock'lama disiplinini bir tarayıcıda tekrarlıyor. Gerçek Tauri app'i DEĞİL —
  gerçek Rust `write_ppsx`/`xlsx_export` hiç çalışmıyor, yalnızca React akışı
  gerçek DOM'da test ediliyor. Export adımı ya atlanır ya da mock'un "başarılı"
  dönmesiyle yetinilir — bu, D-20'nin "gerçekten .xlsx üretiliyor mu" sorusunu
  cevapsız bırakır.
- **Seçenek C — Playwright'ı hiç eklemeden, tek büyük bir Vitest entegrasyon
  testi.** `WorkspaceScreen.test.tsx`'in zaten sahip olduğu "the user can create
  and reorder generic-text entries in every one of the 8 steps" testine emsal —
  sekiz adımda entry ekleme + Export A3 tetikleme akışını TEK bir kapsamlı testte
  birleştir (React Testing Library, gerçek store, gerçek `applyCommand`, Tauri
  IPC'si mock'lanmış). En ucuz, en az yeni bağımlılık, ama "Playwright suite"
  sözü tam karşılanmıyor — SPEC'in kendi lafzı güncellenmesi gerekir, ve gerçek
  tarayıcı/gerçek layout/gerçek Tauri hiç test edilmiyor.

**Bu oturumun kendi önerisi yok — Barış'ın seçimi olmadan hiçbir seçenek
uygulanmamalı.**

### 2.2 Minimal kapsam (hangi araç seçilirse seçilsin)

"AI kapalı mutlu yol" en az şunu kapsamalı:

1. Uygulama açılıyor (launch screen görünüyor).
2. Yeni bir proje oluşturuluyor — AI adımı hiç yok/atlanıyor, `meta.ai.enabled`
   `false` kalıyor.
3. Sekiz adımın her birinde en az bir entry ekleniyor (`generic-text` yeterli —
   metod çeşitliliği bu testin işi değil, §9'un tam kabul testinin işi).
4. A3 önizlemesi hatasız render ediliyor.
5. Export A3 tetikleniyor, gerçek bir `.xlsx` üretiliyor (Seçenek A/C'de
   doğrulanabilir; Seçenek B'de bu adımın nasıl ele alınacağı kendi başına bir
   tasarım kararı).
6. `Assistant` sekmesi hiç görünmüyor (`meta.ai.enabled: false` iken `RightPanel`
   zaten bunu gizliyor — D-133'ten beri var olan davranış, bu test yalnızca
   doğruluyor, yeni bir şey kurmuyor).

### 2.3 CI entegrasyonu

Seçilen aracın `.github/workflows/ci.yml`'e nasıl bağlanacağı bu dilimin kendi
kararı. macOS+Windows runner'larında gerçek bir Tauri app derleyip E2E koşturmak
(Seçenek A) CI süresini ciddi artırabilir — bu maliyet göz önünde bulundurulmalı,
gerekirse yalnızca bir platformda veya yalnızca `main`'e push'ta çalıştırma gibi
bir uzlaşı Barış'a sorulmalı.

---

## 3. Kapsam dışı

- AI açıkken çalışan herhangi bir E2E testi — D-20 yalnızca **AI KAPALI** yolunu
  istiyor; SPEC.md §9'un ikinci (AI açık) kabul testi Faz 9/10'un işi.
- `SPEC.md` §9'un tam temel kabul testi (8 adım × en az 3 metod, 6 fotoğraf, 2
  Pareto grafiği, başka makinede açma) — çok daha büyük, bu dilimin bütçesini
  aşar. Bu dilim yalnızca D-20'nin dar cümlesini karşılıyor.
- Vorion'a dokunan hiçbir şey — Dilim 1/2 zaten bitti, bu dilim onlara bağımlı
  değil ve onları değiştirmiyor.

---

## 4. Bütçe ve kapanış disiplini

§2.1'in araştırma/karar adımı gerçek dokümantasyon taraması gerektiriyor — Vorion
oturumlarındaki "hafızadan yazma, dokümana karşı doğrula" dersi burada da geçerli.
E2E altyapısının SIFIRDAN kurulması (hangi araç seçilirse seçilsin) tek başına
D-114'ün "dilim başına bir yeni mekanizma" bütçesini dolduruyor — bu dilime ek
metod/özellik eklenmemeli.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (seçilen araç + gerekçesi dahil),
`docs/oturumlar/README.md`'nin Dilim 3 satırı ve **Faz 8'in kendi durumu** ("üç
dilim de bitti") güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir. Eğer
Seçenek A veya B seçildiyse, `SPEC.md`'nin Faz 0 tablosundaki "Playwright (e2e)"
satırı da gerçek karara göre düzeltilmeli (SPEC'i sessizce eskimiş bırakmamak).

---

**Model önerisi:** Sonnet 5 yeterli. §2.1'in kendi araştırma/karar adımı bir mimari
seçim sayılabilir (D-28'in routing mantığına göre Opus değerlendirilebilir) ama
kapsam Dilim 1/2'den daha dar ve tek bir yeni mekanizmaya (E2E altyapısı) odaklı.
