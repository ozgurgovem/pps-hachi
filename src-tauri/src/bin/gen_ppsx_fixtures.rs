//! D-62: generates the checked-in `.ppsx` fixture corpus used by the
//! migration chain's regression test — authentic files produced by the real
//! Phase 2 writer, not JSON hand-typed to resemble what v1 is believed to
//! look like. Run on demand with `cargo run --bin gen_ppsx_fixtures` when the
//! fixture set needs to change; `cargo test` never regenerates them.

use pps_hachi_lib::ppsx::write_ppsx;
use serde_json::{json, Value};

fn manifest_and_ids(id: &str, now: &str) -> Value {
    json!({
        "id": id,
        "schemaVersion": 1,
        "appVersion": "0.1.0",
        "created": now,
        "modified": now,
    })
}

fn fixtures_dir() -> std::path::PathBuf {
    std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("src-tauri has a parent directory")
        .join("fixtures")
        .join("ppsx")
}

fn write_fixture(file_name: &str, id: &str, project: Value) {
    let now = "2026-08-02T00:00:00.000Z";
    let manifest = manifest_and_ids(id, now);
    let dir = fixtures_dir();
    std::fs::create_dir_all(&dir).expect("create fixtures/ppsx");
    let path = dir.join(file_name);
    write_ppsx(&path, &manifest, &project, &[], None).expect("write fixture ppsx");
    println!("wrote {}", path.display());
}

fn empty_steps() -> Value {
    json!({ "1": {"entries": []}, "2": {"entries": []}, "3": {"entries": []}, "4": {"entries": []},
            "5": {"entries": []}, "6": {"entries": []}, "7": {"entries": []}, "8": {"entries": []} })
}

fn minimal_project(id: &str) -> Value {
    let now = "2026-08-02T00:00:00.000Z";
    json!({
        "id": id,
        "schemaVersion": 1,
        "meta": {
            "title": "Untitled project",
            "projectCode": "",
            "revision": "",
            "owner": { "name": "" },
            "team": [],
            "status": "draft",
            "openedAt": now,
            "language": "en",
            "ai": { "enabled": false, "redaction": {} }
        },
        "templateId": "farplas-7step-tr",
        "steps": empty_steps(),
        "signOff": {},
        "rounds": []
    })
}

fn fully_populated_project(id: &str) -> Value {
    let now = "2026-08-02T00:00:00.000Z";
    let entry = |step_note: &str| {
        json!({
            "id": format!("entry-{step_note}"),
            "methodId": "pareto",
            "title": format!("Pareto — {step_note}"),
            "order": 0,
            "a3Visibility": "primary",
            "payload": { "bars": [{"label": "A", "value": 12}, {"label": "B", "value": 4}] },
            "images": [{ "id": "img-1", "assetPath": "assets/img_1.png", "thumbnailPath": "assets/thumb_1.webp" }],
            "createdAt": now,
            "updatedAt": now,
            "author": "B. Gövem",
            "provenance": {
                "origin": "ai-edited",
                "model": { "providerId": "anthropic", "modelId": "claude-sonnet-5", "promptVersion": "v1" },
                "generatedAt": now,
                "acceptedBy": "B. Gövem",
                "acceptedAt": now,
                "editDistance": 0.2
            }
        })
    };

    // D-116/D-117 (Phase 6b): one countermeasure carrying two cross-step
    // references — one that resolves to the Step 4 entry above, and one
    // deliberately left **dangling**. The dangling half is the point: D-117
    // says referential integrity is never checked at load, so a `.ppsx`
    // written before its target was deleted must still open cleanly through
    // both the real Rust reader and Zod. Baking it into the corpus makes that
    // promise permanent rather than something a future phase can quietly drop.
    let countermeasure = json!({
        "id": "entry-step5-countermeasure",
        "methodId": "countermeasure",
        "title": "Fikstüre varlık sensörü tak",
        "order": 0,
        "a3Visibility": "primary",
        "payload": {
            "description": "Fikstüre varlık sensörü takılacak",
            "expectedEffect": "Eksik parça ile çevrim başlatılamaz",
            "owner": "A. Yılmaz",
            "targetDate": "2026-09-15",
            "status": "approved"
        },
        "images": [],
        "createdAt": now,
        "updatedAt": now,
        "provenance": { "origin": "human" },
        "references": [
            { "role": "rootCause", "targetEntryId": "entry-step4" },
            { "role": "rootCause", "targetEntryId": "entry-deleted-long-ago" }
        ]
    });

    json!({
        "id": id,
        "schemaVersion": 1,
        "meta": {
            "title": "Şişli Hattı Arıza Analizi",
            "projectCode": "PPS-2026-014",
            "revision": "B",
            "partNumber": "32-4471",
            "partName": "Bracket, mount",
            "customer": "Farplas",
            "plant": "Gebze",
            "department": "Quality",
            "line": "L4",
            "owner": { "name": "B. Gövem", "email": "b.govem@example.com" },
            "team": [{ "name": "A. Yılmaz" }],
            "status": "active",
            "openedAt": now,
            "closedAt": now,
            "language": "tr",
            "linkedRecords": [{ "type": "8D", "ref": "8D-2026-091" }],
            "ai": { "enabled": true, "providerId": "vorion", "modelId": "openai/gpt-4o", "redaction": {} }
        },
        "templateId": "farplas-7step-tr",
        "steps": {
            "1": {"entries": [entry("step1")], "notes": "Photo board complete"},
            "2": {"entries": [entry("step2")]},
            "3": {"entries": []},
            "4": {"entries": [entry("step4")]},
            "5": {"entries": [countermeasure]},
            "6": {"entries": []},
            "7": {"entries": []},
            "8": {"entries": []}
        },
        "signOff": {
            "preparedBy": { "name": "B. Gövem", "signedAt": now },
            "reviewedBy": { "name": "A. Yılmaz", "signedAt": now },
            "approvedBy": { "name": "C. Demir", "signedAt": now }
        },
        "rounds": [{ "id": "round-1", "openedAt": now, "reason": "containment failed", "closedAt": now }]
    })
}

fn turkish_text_project(id: &str) -> Value {
    let now = "2026-08-02T00:00:00.000Z";
    let mut project = minimal_project(id);
    project["meta"]["title"] = json!("Kaynak Hatası — İğneli Şişli Çözümü");
    project["meta"]["customer"] = json!("Öztürk Otomotiv A.Ş.");
    project["meta"]["owner"] = json!({ "name": "Gökçe Çağlıyan" });
    project["meta"]["language"] = json!("tr");
    project["steps"]["4"] = json!({
        "entries": [{
            "id": "entry-tr-1",
            "methodId": "five-why-3leg",
            "title": "Kök neden — ısı kaynaklı çekme",
            "order": 0,
            "a3Visibility": "primary",
            "payload": { "note": "Kaynak dikişinde ısıl gerilme birikmesi tespit edildi." },
            "images": [],
            "createdAt": now,
            "updatedAt": now,
            "provenance": { "origin": "human" }
        }]
    });
    project
}

/**
 * Faz 10/K2/D-213: the "deliberately-bad project" half of Faz 10's own
 * acceptance scenario ("flags a weak root cause on a deliberately-bad
 * project"). Every mechanical S1-S8 gate reads this project as clean —
 * that is the point: the three narrative breaks below are exactly the class
 * `evaluateReadiness` cannot see, which is what `MockAuditPanel`'s AI review
 * exists to catch instead.
 *
 * - Step 4's one hypothesis is marked `verdict: "confirmed"` (satisfies S4's
 *   mechanical "some root cause is verified" check) but the confirmed cause
 *   itself blames an individual ("operatör dikkatsizliği") rather than a
 *   systemic factor — SPEC.md §1.2 S4's own second sentence, P-46.
 * - Step 6 is left completely empty (an empty step never flags S6 — D-196's
 *   own "empty = neutral" rule) — nothing was ever actually implemented.
 * - Step 8's one document-update row is marked `status: "complete"` (satisfies
 *   S8's mechanical "some document is marked updated" check) even though
 *   nothing in Step 6 supports it having actually happened.
 * - Step 3's SMART target and Step 7 (left empty, same "empty = neutral"
 *   reasoning as Step 6) never connect — nothing in the project reports
 *   against the stated target's own metric.
 */
fn deliberately_bad_project(id: &str) -> Value {
    let now = "2026-08-02T00:00:00.000Z";

    json!({
        "id": id,
        "schemaVersion": 1,
        "meta": {
            "title": "Şişli Hattı — Fire Oranı Analizi (kötü örnek)",
            "projectCode": "PPS-2026-099",
            "revision": "A",
            "owner": { "name": "B. Gövem" },
            "team": [],
            "status": "active",
            "openedAt": now,
            "language": "tr",
            "ai": { "enabled": true, "providerId": "vorion", "modelId": "vorion/gpt-4o", "redaction": {} }
        },
        "templateId": "farplas-7step-tr",
        "steps": {
            "1": { "entries": [{
                "id": "bad-step1-gap",
                "methodId": "gap-statement",
                "title": "Fire oranı hedefin üzerinde",
                "order": 0,
                "a3Visibility": "primary",
                "payload": {
                    "ideal": "Fire oranı %1,0",
                    "actual": "Fire oranı %4,2",
                    "gap": "%3,2 fark",
                    "gapValue": 3.2,
                    "unit": "%",
                    "baselinePeriod": "2026 Ç2"
                },
                "images": [],
                "createdAt": now,
                "updatedAt": now,
                "provenance": { "origin": "human" }
            }] },
            "2": { "entries": [
                {
                    "id": "bad-step2-pareto",
                    "methodId": "pareto",
                    "title": "Fire nedenleri dağılımı",
                    "order": 0,
                    "a3Visibility": "primary",
                    "payload": { "unit": "count", "categories": [{ "id": "flash", "label": "Çapak", "count": 30 }] },
                    "images": [],
                    "createdAt": now,
                    "updatedAt": now,
                    "provenance": { "origin": "human" }
                },
                {
                    "id": "bad-step2-poc",
                    "methodId": "point-of-cause",
                    "title": "Sebep noktası — kalıp boşluğu 3",
                    "order": 1,
                    "a3Visibility": "primary",
                    "payload": {
                        "processStep": "Enjeksiyon",
                        "location": "Kalıp boşluğu 3",
                        "occursWhen": "Her vardiya başında",
                        "evidence": "Fire kaydı",
                        "observedAt": now,
                        "observedBy": "A. Yılmaz"
                    },
                    "images": [],
                    "createdAt": now,
                    "updatedAt": now,
                    "provenance": { "origin": "human" }
                }
            ] },
            "3": { "entries": [{
                "id": "bad-step3-target",
                "methodId": "smart-target",
                "title": "Fire oranını düşür",
                "order": 0,
                "a3Visibility": "primary",
                "payload": {
                    "metric": "Fire oranı",
                    "baseline": 4.2,
                    "target": 1.0,
                    "unit": "%",
                    "dueDate": "2026-10-01",
                    "owner": "B. Gövem",
                    "prioritizedItems": [],
                    "stakeholderNote": ""
                },
                "images": [],
                "createdAt": now,
                "updatedAt": now,
                "provenance": { "origin": "human" }
            }] },
            "4": { "entries": [{
                "id": "bad-step4-hypothesis",
                "methodId": "hypothesis-verification",
                "title": "Kök neden doğrulama",
                "order": 0,
                "a3Visibility": "primary",
                "payload": { "rows": [{
                    "id": "row-1",
                    "candidateCause": "Operatör dikkatsizliği",
                    "verificationMethod": "Gözlem",
                    "evidence": "Vardiya raporu",
                    "verdict": "confirmed",
                    "confidencePercent": "80",
                    "residualUncertainty": "",
                    "customerRelevance": ""
                }] },
                "images": [],
                "createdAt": now,
                "updatedAt": now,
                "provenance": { "origin": "human" },
                "references": [{ "role": "pointOfCause", "targetEntryId": "bad-step2-poc" }]
            }] },
            "5": { "entries": [{
                "id": "bad-step5-countermeasure",
                "methodId": "countermeasure",
                "title": "Operatör eğitimi tazelensin",
                "order": 0,
                "a3Visibility": "primary",
                "payload": {
                    "description": "Operatörlere tekrar eğitim verilecek",
                    "expectedEffect": "Dikkatsizlik azalır",
                    "owner": "A. Yılmaz",
                    "targetDate": "2026-09-15",
                    "status": "approved",
                    "impactScore": "",
                    "costScore": "",
                    "durationScore": "",
                    "priorityDecision": "pending"
                },
                "images": [],
                "createdAt": now,
                "updatedAt": now,
                "provenance": { "origin": "human" },
                "references": [{ "role": "rootCause", "targetEntryId": "bad-step4-hypothesis" }]
            }] },
            "6": { "entries": [] },
            "7": { "entries": [] },
            "8": { "entries": [
                {
                    "id": "bad-step8-documents",
                    "methodId": "document-updates-tracker",
                    "title": "Doküman güncellemeleri",
                    "order": 0,
                    "a3Visibility": "primary",
                    "payload": {
                        "pfmea": { "updateRequired": "", "docId": "", "revision": "", "owner": "", "dueDate": "", "status": "notStarted", "approval": "draft", "evidence": "", "customerSubmission": "no" },
                        "controlPlan": {
                            "updateRequired": "yes",
                            "docId": "CP-32-4471",
                            "revision": "C",
                            "owner": "A. Yılmaz",
                            "dueDate": "2026-09-20",
                            "status": "complete",
                            "approval": "approved",
                            "evidence": "Güncellenmiş kontrol planı",
                            "customerSubmission": "no"
                        },
                        "workInstruction": { "updateRequired": "", "docId": "", "revision": "", "owner": "", "dueDate": "", "status": "notStarted", "approval": "draft", "evidence": "", "customerSubmission": "no" },
                        "inspectionStandard": { "updateRequired": "", "docId": "", "revision": "", "owner": "", "dueDate": "", "status": "notStarted", "approval": "draft", "evidence": "", "customerSubmission": "no" },
                        "trainingCompetence": { "updateRequired": "", "docId": "", "revision": "", "owner": "", "dueDate": "", "status": "notStarted", "approval": "draft", "evidence": "", "customerSubmission": "no" },
                        "layeredProcessAudit": { "updateRequired": "", "docId": "", "revision": "", "owner": "", "dueDate": "", "status": "notStarted", "approval": "draft", "evidence": "", "customerSubmission": "no" },
                        "apqpPpapRecord": { "updateRequired": "", "docId": "", "revision": "", "owner": "", "dueDate": "", "status": "notStarted", "approval": "draft", "evidence": "", "customerSubmission": "no" }
                    },
                    "images": [],
                    "createdAt": now,
                    "updatedAt": now,
                    "provenance": { "origin": "human" }
                },
                {
                    "id": "bad-step8-yokoten",
                    "methodId": "yokoten-tracker",
                    "title": "Yatay yayılım",
                    "order": 1,
                    "a3Visibility": "primary",
                    "payload": { "rows": [{
                        "id": "row-1",
                        "siteLine": "L4",
                        "applicability": "Aynı kalıp tipi kullanan diğer hatlar",
                        "riskReviewed": "yes",
                        "actionRequired": "Kontrol planı yayılacak",
                        "owner": "A. Yılmaz",
                        "dueDate": "2026-10-15",
                        "status": "inProgress",
                        "completionEvidence": "",
                        "effectivenessChecked": "no",
                        "checkDate": "",
                        "result": "",
                        "approval": "underReview",
                        "notes": ""
                    }] },
                    "images": [],
                    "createdAt": now,
                    "updatedAt": now,
                    "provenance": { "origin": "human" }
                }
            ] }
        },
        "signOff": {},
        "rounds": []
    })
}

fn unknown_method_project(id: &str) -> Value {
    let now = "2026-08-02T00:00:00.000Z";
    let mut project = minimal_project(id);
    project["steps"]["5"] = json!({
        "entries": [{
            "id": "entry-unknown-1",
            "methodId": "future-method-not-yet-invented",
            "title": "From a build newer than this one",
            "order": 0,
            "a3Visibility": "hidden",
            "payload": { "shape": "nobody currently registered knows this", "nested": { "arbitrary": [1, 2, 3] } },
            "images": [],
            "createdAt": now,
            "updatedAt": now,
            "provenance": { "origin": "human" }
        }]
    });
    project
}

fn main() {
    write_fixture(
        "minimal.ppsx",
        "fixture-minimal",
        minimal_project("fixture-minimal"),
    );
    write_fixture(
        "fully-populated.ppsx",
        "fixture-fully-populated",
        fully_populated_project("fixture-fully-populated"),
    );
    write_fixture(
        "turkish-text.ppsx",
        "fixture-turkish-text",
        turkish_text_project("fixture-turkish-text"),
    );
    write_fixture(
        "unknown-method.ppsx",
        "fixture-unknown-method",
        unknown_method_project("fixture-unknown-method"),
    );
    write_fixture(
        "deliberately-bad.ppsx",
        "fixture-deliberately-bad",
        deliberately_bad_project("fixture-deliberately-bad"),
    );
}
