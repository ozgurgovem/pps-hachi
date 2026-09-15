# OTURUM — AI katmanı temizliği: P-51 + P-56 + P-57 + P-60

> Dört bağımsız, küçük-orta boy, iyi tanımlanmış AI-katmanı gediği — hepsi Faz 9/10'un
> (`docs/oturumlar/P-yigini-durum-taramasi.md`'nin kendi taramasında) zaten bilinen, dosyalanmış
> gedikleri. Barış'ın kendi seçimiyle "sıradaki dilim" kümelerinden biri olarak işaretlendi
> (2026-09-15, bu envanter oturumunun kendi `AskUserQuestion` turunda).
>
> Dördü de FARKLI dosyalara dokunuyor (`ai/redaction.rs` çağrı yeri vs. `entryTranslation.ts`
> vs. yeni bir `meta.language.set` komutu vs. `usage.rs`'in kendi `accepted` alanı) — aynı
> oturumda art arda yapılabilir, ya da bağımsız worktree'lerde paralelleştirilebilir (Anayasa
> Madde 3). Hiçbiri diğerine bağımlı değil.
>
> Kanonik konum: `docs/oturumlar/ai-katmani-temizligi.md`. Yazıldı: 2026-09-15,
> `P-yigini-durum-taramasi.md`'nin kendi kapanışında.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
grep -n "P-51\|P-56\|P-57\|P-60" DECISIONS.md | grep "^[0-9]*:| P-"
  # Dördünün de hâlâ OPEN olduğunu (KAPANDI değil) teyit et — bu dosya yazıldıktan sonra
  # biri zaten kapanmış olabilir.

grep -rn "redact_text\|unredact_json_value" src-tauri/src/ai/commands.rs
  # P-51: ai_complete (serbest sohbet, completeStreaming) komutunun redaction parametresi
  # ALMADIĞINI doğrula — alıyorsa P-51 zaten kapanmış olabilir.

grep -n "collectCondensableFields" src/app/routes/workspace/entryTranslation.ts src/app/routes/workspace/layoutReview.ts
  # P-56: whole-report çeviri hâlâ K1'in aynı ≥80-karakter eşiğini mi kullanıyor?

grep -n "\"meta.language.set\"\|MetaLanguageSet" src/domain/commands/types.ts
  # P-57: hiç eşleşme YOK bekleniyor — komut hâlâ inşa edilmedi.

grep -n "accepted" src-tauri/src/ai/usage.rs | grep -i "option\|none"
  # P-60: accepted alanı hâlâ Option<bool> ve hep None mu?
```

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. P-51 — `AssistantPanel`'in serbest sohbeti (`ai_complete`) redaksiyondan geçmiyor

### 1.1 Mevcut durum

`redact_text`/`unredact_json_value` (`src-tauri/src/ai/redaction.rs`) zaten genel-amaçlı ve
`ai_complete_structured` (K1/K2/K3'ün yapılandırılmış çağrıları) + D-247'nin sohbetten-girdi-
düzenleme akışı (`identifySuggestionTargetEntry`/`proposeEntryEditFromSuggestion`) tarafından
zaten kullanılıyor. Yalnızca ham keşif sohbeti (`ai_complete`, `completeStreaming`, D-201/
D-245) redaksiyonsuz — kullanıcı `AssistantPanel`'de elle bir müşteri adı yazarsa, ya da
D-246'nın entry-özet enjeksiyonu (`stepAiContext.ts`) redaksiyon açık bir projede bile o
içeriği maskesiz gönderiyor.

### 1.2 Neden zor — streaming + redaksiyon birlikte

`ai_complete_structured`'ın redaksiyonu basit: tam yanıt tek seferde gelir,
`unredact_json_value` bir kerede çalışır. `ai_complete` **streaming** (SSE, `Channel<StreamEvent>`,
D-201) — kısmi bir chunk'ın ortasında bir redaksiyon token'ı (`[REDACTED_1]` gibi) yarım kesilmiş
olabilir, chunk'lar arası state tutmadan unredact etmek D-136'nın kendi Türkçe-karakter-
parçalanma dersiyle (SSE byte sınırı ≠ karakter sınırı) aynı sınıf bir tuzak. Kodlamadan önce
gerçek `drain_sse_events`/`StreamEvent::Chunk` akışını oku (`src-tauri/src/ai/vorion.rs`) —
redaksiyon tokenlarının bir chunk sınırında bölünüp bölünemeyeceğini kanıtla, tahmin etme.

### 1.3 Öneri (bu oturumun kendi kararı, körü körüne uygulanmamalı)

En basit güvenli yol muhtemelen: `redact_text`'i **istek gönderilmeden önce** (kullanıcının
sorusu + D-246'nın entry-özetleri) uygula, ama **yanıtı unredact ETME** — yalnızca giden
tarafı koru, gelen tarafı olduğu gibi göster (Vorion zaten `[REDACTED_1]` token'ını yanıtında
tekrar etmeyecek, kendi cümlelerini kuracak). Bu, D-247'nin `complete_structured` yolunun
(hem giden hem gelen redaksiyon) tam simetrisini streaming'e taşımaktan daha ucuz ve gerçek
riski (müşteri adının Vorion'a gitmesi) zaten kapatıyor. Barış'a `AskUserQuestion` ile bu
asimetriyi (giden redakte, gelen değil) açıkça onaylat — sessizce varsayma.

### 1.4 Test/doğrulama

- Yeni bir Rust testi: `ai_complete`'e giden `CompletionRequest`'in redaksiyon uygulanmış
  metni taşıdığını doğrula (mock/fake provider ile).
- `AssistantPanel`'in kendi testinde, redaksiyon açık bir projede yazılan bir müşteri adının
  Vorion'a giden isteğin `prompt` alanında GÖRÜNMEDİĞİNİ doğrulayan bir regresyon testi.

---

## 2. P-56 — whole-report çeviri kısa/meta-header alanları kapsamıyor

### 2.1 Mevcut durum

`TranslateReportPanel`'in whole-report akışı K1'in `collectCondensableFields`'ını (title +
≥80 karakter string payload alanları) değiştirilmeden yeniden kullanıyor — kısa (<80 karakter)
gerçek serbest-metin alanlar ve `meta.title`/`meta.customer`/`meta.partName` hiç teklif
edilmiyor.

### 2.2 Gerçek tasarım gerilimi (P-55'in kendi notuyla aynı sınıf)

Eşiği düşürmek (örn. 20 karaktere) kısa enum-kodlu alanların (durum değerleri) yanlışlıkla
çeviri teklifine girmesi riskini geri getirir — bu, K1'in kendi ≥80 eşiğinin BİLİNÇLİ nedeniydi
(kısa kodlu alanların modele hiç gösterilmemesi, şemayı bozma riskini yapısal olarak
engelliyordu). `meta.title`/`meta.customer`/`meta.partName` ayrı bir sorun — bunlar
`collectCondensableFields`'ın hiç bakmadığı `ProjectModel.meta` alanları, `Entry.payload`
değil.

### 2.3 Öneri

`meta.*` alanları için AYRI, küçük bir mekanizma (yeni bir "rapor başlığı" satırı, K1'in diff
şemasına `entryId: "meta"` gibi özel bir anahtar eklemeden — belki `TranslateReportPanel`'in
kendi üstünde, `RightPanel`/entry akışının dışında, üç sabit alanı ayrı listeleyen bir mini-
panel). Kısa serbest-metin alanlar için eşiği değiştirmek yerine YAGNI'den kapsam dışı
bırakılması da meşru bir sonuç — Barış'a `AskUserQuestion` ile sor: (a) meta-header alanları
ekle (küçük, ayrı mekanizma), (b) kısa alanlar için eşiği düşür (riskli, K1'in kendi güvenlik
motivasyonunu zayıflatır), (c) ikisini de YAGNI'den kapat, satırı "kabul edilen sınır" olarak
işaretle.

---

## 3. P-57 — `meta.language.set` komutu yok

### 3.1 Mevcut durum

D-58'in `rounds.set`/`signOff.set` ve D-224'ün `meta.ai.set` emsaliyle AYNI şekle (proje-
seviyesi, `stepId` yok) sahip bir `meta.language.set` komutu hiç inşa edilmedi — kullanıcının
projenin dilini (TR↔EN) gerçekten değiştirebileceği hiçbir yol yok. K3'ün çeviri Accept'leri
(hem field-level hem whole-report) bilerek bu alana asla yazmıyor (D-15/D-213'ün "asla
sessizce" kuralı) — ama tersi de eksik.

### 3.2 Mekanik (düşük risk, D-58/D-224'ün doğrudan tekrarı — yeni bir mimari karar DEĞİL)

`src/domain/commands/types.ts`'e `MetaLanguageSetCommand` (`type: "meta.language.set"`),
`builders.ts`'e `buildSetMetaLanguageCommand`, `applyCommand.ts`/`invertCommand.ts`/`index.ts`
D-224'ün `MetaProjectInfoSetCommand`'ının BİREBİR aynı şeklinde genişletilir. UI tarafı:
muhtemelen `SettingsScreen`'in "Project Info" bölümüne (D-224'ün eklediği) bir dil seçici.

### 3.3 Gerçek açık soru

Dili değiştirmek `HtmlA3Renderer`/`buildA3Layout`'un okuduğu her export etiketini (D-188'in
i18n mekanizması, `resolveA3Language`) anında etkiler — proje ortasında dil değiştirmenin
UX'i (uyarı mı gösterilsin, "bu, tüm export etiketlerini değiştirir" diye mi?) Barış'a
`AskUserQuestion` ile sorulmalı, körü körüne sessiz bir Select eklenmemeli.

### 3.4 Test/doğrulama

D-224'ün kendi `builders.test.ts`/`applyCommand.test.ts` eklemelerinin BİREBİR aynı şeklini
takip et (mutation-verified: `meta.language.set` olmadan `meta.language`'ın hiç değişmediğini
kanıtlayan bir RED-önce-GREEN-sonra testi).

---

## 4. P-60 — cost-log'un accept/reject korelasyonu yok

### 4.1 Mevcut durum

`AiLogEntry.accepted: Option<bool>` her zaman `None` — `ai_complete_structured` TS'e bu
metadata'yı hiç dönmüyor (K4'ün D-221'deki kendi §2.1 seçimi), bir log kaydını sonraki
Accept/Reject kararıyla eşleştirecek bir korelasyon mekanizması yok.

### 4.2 Gerçek tasarım gerilimi

`ai_complete_structured`'ın kendi çağrı anında henüz bir "accept" kararı YOK — karar dakikalar
sonra, ayrı bir kullanıcı etkileşiminde (Accept/Edit&Accept/Reject butonuna tıklama) geliyor.
Bir log satırını sonradan güncellemek gerekiyor (`ai-log.jsonl`'ın append-only mu, yoksa
düzenlenebilir mi olduğu — `usage.rs`'i oku) — ya da her log satırına bir `request_id` verip,
TS tarafının Accept anında ayrı bir `ai_mark_accepted(request_id, accepted)` komutu çağırması
gerekiyor (yeni bir IPC yüzeyi, küçük ama gerçek).

### 4.3 Öneri

TS tarafının zaten her `complete_structured` çağrısının ne için kullanıldığını (K1 diff satırı,
K2 audit bulgusu, K3 çeviri, D-247 entry-edit) bildiğini unutma — `request_id`'yi
`complete_structured`'ın kendi dönüş değerine ekleyip, Accept/Reject anında TS'in
`ai_mark_accepted` çağırması en doğru yer. `ai-log.jsonl`'ın append-only kalıp kalmayacağı
(bir satırı sonradan güncellemek D-74'ün "sidecar, crash-safe olmak zorunda değil" duruşuna mı
aykırı, yoksa yeni bir `accepted` satırı mı append edilecek — iki satırın aynı `request_id`'yi
paylaşması) Barış'a `AskUserQuestion` ile sorulmalı.

### 4.4 Test/doğrulama

Rust: `ai_mark_accepted` komutu + `usage.rs`'in kendi append/update mantığı, mutation-
verified. TS: her dört çağrı yeri (K1/K2/K3/D-247) Accept/Reject anında bu yeni komutu
çağırdığını doğrulayan testler.

---

## 5. Bütçe ve kapanış disiplini

Dördü de D-114'ün "bir dilim = bir yeni mekanizma" bütçesinin İÇİNDE tutulabilir eğer AYRI
oturumlarda yapılırsa (her biri kendi küçük mekanizması) — aynı oturumda hepsi birden
denenirse P-51 (streaming+redaksiyon) ve P-60 (yeni IPC yüzeyi) ikisi de gerçek yeni mekanizma
sayılır, ikisini aynı oturuma sığdırmak riskli. **Öneri: P-57 + P-56 bir oturum (ikisi de
küçük, D-58/D-224 emsellerinin tekrarı), P-51 + P-60 ayrı bir oturum (ikisi de gerçek yeni
mimari kararlar gerektiriyor).**

Her biri kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, ilgili P-maddesinin kendi satırının
KAPANDI olarak işaretlenmesi.

---

**Model önerisi**: Sonnet 5 yeterli — dördü de mevcut desenlerin (D-58/D-224/D-205) tekrarı
veya küçük, iyi sınırlı yeni mekanizma, derin mimari araştırma gerekmiyor (D-28).
