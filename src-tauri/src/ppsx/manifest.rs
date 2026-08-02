use serde_json::Value;

use super::error::PpsxError;

/// D-54: `manifest.json` is the routing header, read first and structurally
/// validated in Rust — but "structurally" stops at the two routing fields
/// (`id`, `schemaVersion`). Rust never parses the rest of either file's
/// content (D-55); the full `ProjectModel` shape is a TS/Zod concern.
/// A mismatch between the two files is reported as corrupt, never reconciled.
pub fn check_routing_ids(manifest: &Value, project: &Value) -> Result<(), PpsxError> {
    let manifest_id = require_string_field(manifest, "manifest.json", "id")?;
    let manifest_schema_version = require_u64_field(manifest, "manifest.json", "schemaVersion")?;
    let project_id = require_string_field(project, "project.json", "id")?;
    let project_schema_version = require_u64_field(project, "project.json", "schemaVersion")?;

    if manifest_id != project_id {
        return Err(PpsxError::Corrupt(format!(
            "manifest.json id ({manifest_id}) does not match project.json id ({project_id})"
        )));
    }
    if manifest_schema_version != project_schema_version {
        return Err(PpsxError::Corrupt(format!(
            "manifest.json schemaVersion ({manifest_schema_version}) does not match project.json schemaVersion ({project_schema_version})"
        )));
    }
    Ok(())
}

fn require_string_field(value: &Value, file: &str, field: &str) -> Result<String, PpsxError> {
    value
        .get(field)
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or_else(|| PpsxError::Corrupt(format!("{file} is missing string field '{field}'")))
}

fn require_u64_field(value: &Value, file: &str, field: &str) -> Result<u64, PpsxError> {
    value
        .get(field)
        .and_then(Value::as_u64)
        .ok_or_else(|| PpsxError::Corrupt(format!("{file} is missing numeric field '{field}'")))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn accepts_matching_id_and_schema_version() {
        let manifest = json!({ "id": "p1", "schemaVersion": 1 });
        let project = json!({ "id": "p1", "schemaVersion": 1, "meta": {} });

        check_routing_ids(&manifest, &project).expect("matching ids should pass");
    }

    #[test]
    fn rejects_mismatched_id() {
        let manifest = json!({ "id": "p1", "schemaVersion": 1 });
        let project = json!({ "id": "p2", "schemaVersion": 1 });

        let err = check_routing_ids(&manifest, &project).unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)));
    }

    #[test]
    fn rejects_mismatched_schema_version() {
        let manifest = json!({ "id": "p1", "schemaVersion": 2 });
        let project = json!({ "id": "p1", "schemaVersion": 1 });

        let err = check_routing_ids(&manifest, &project).unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)));
    }

    #[test]
    fn rejects_manifest_missing_id() {
        let manifest = json!({ "schemaVersion": 1 });
        let project = json!({ "id": "p1", "schemaVersion": 1 });

        let err = check_routing_ids(&manifest, &project).unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)));
    }

    #[test]
    fn rejects_non_numeric_schema_version() {
        let manifest = json!({ "id": "p1", "schemaVersion": "one" });
        let project = json!({ "id": "p1", "schemaVersion": 1 });

        let err = check_routing_ids(&manifest, &project).unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)));
    }
}
