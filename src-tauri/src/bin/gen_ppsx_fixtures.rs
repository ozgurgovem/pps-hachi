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
            "ai": { "enabled": true, "providerId": "anthropic", "modelId": "claude-sonnet-5", "redaction": {} }
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
}
