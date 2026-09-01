use serde::{Deserialize, Serialize};

/// SPEC.md §8.11's own draft type, narrowed per D-203/D-205's "minimal,
/// real first version": `"customers-and-parts"`/`"custom"` are real modes
/// in SPEC's draft but out of this dilim's scope (§3) — adding a case here
/// later is additive, the same posture `RedactionPolicySchema`'s TS mirror
/// already takes.
#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum RedactionMode {
    Off,
    Customers,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RedactionPolicy {
    pub mode: RedactionMode,
    pub terms: Vec<String>,
    /// SPEC.md §8.11's own literal-`true` field. Never separately consulted
    /// by `redact_text` below — masking only ever replaces exact matches of
    /// a user-supplied term, so a bare number is never touched regardless
    /// of this flag's value; it exists for schema parity with SPEC's draft
    /// type, not because the masking logic branches on it.
    pub preserve_numbers: bool,
}

/// One redacted term's real value alongside the token that replaced it —
/// SPEC.md §8.11 calls the reversing mechanism a "session-scoped token
/// map." J2's own proposal flow (`EntryProposalField` → `complete_structured`)
/// is a single request/response round trip, so a map built and consumed
/// entirely inside one call already satisfies "mask before send, unmask
/// when the response comes back" — a map with real cross-request identity
/// (the same customer always getting the same letter across separate
/// proposals in one workspace session) would need somewhere to persist
/// between calls, which is real, unbuilt scope noted in this dilim's own
/// closing record rather than assumed away.
#[derive(Debug, Clone, PartialEq)]
pub struct RedactionToken {
    pub token: String,
    pub original: String,
}

const TOKEN_LETTERS: &[char] = &[
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
    'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

/// Assigns each non-blank configured term a stable token by its position in
/// `policy.terms`, not by where (or whether) it actually occurs in a given
/// prompt — deterministic, and a term absent from this particular prompt
/// never shifts the letters assigned to the terms after it in the list.
fn build_tokens(policy: &RedactionPolicy) -> Vec<RedactionToken> {
    policy
        .terms
        .iter()
        .filter(|term| !term.trim().is_empty())
        .enumerate()
        .map(|(index, term)| RedactionToken {
            token: format!(
                "Customer {}",
                TOKEN_LETTERS.get(index).copied().unwrap_or('?')
            ),
            original: term.clone(),
        })
        .collect()
}

/// SPEC.md §8.11: "Redaction runs on the Rust side, after ingestion, before
/// transmission" — called from `VorionProvider::complete_structured` right
/// before the HTTP request is built, over the *whole* assembled prompt
/// (manually typed text and any file-derived summary alike, per this
/// dilim's own design round: TS never redacts on its own, so there is
/// exactly one point where a request can leave unmasked). Terms are
/// matched longest-first so one term that is a substring of another (e.g.
/// "Acme" inside "Acme Corp") never partially masks the longer one.
/// `mode: Off` returns the text unchanged with an empty token list, making
/// the caller's later `unredact_json_value` call a no-op too.
pub fn redact_text(text: &str, policy: &RedactionPolicy) -> (String, Vec<RedactionToken>) {
    if policy.mode == RedactionMode::Off {
        return (text.to_string(), Vec::new());
    }

    let mut tokens = build_tokens(policy);
    tokens.sort_by_key(|t| std::cmp::Reverse(t.original.len()));

    let masked = tokens.iter().fold(text.to_string(), |acc, token| {
        acc.replace(&token.original, &token.token)
    });
    (masked, tokens)
}

/// Reverses `redact_text`'s substitution inside a structured JSON response
/// — walks every string value at any depth, since the model's response to
/// a `complete_structured` request is a JSON object matching a method's
/// schema, not a single string.
pub fn unredact_json_value(value: &mut serde_json::Value, tokens: &[RedactionToken]) {
    match value {
        serde_json::Value::String(s) => {
            for token in tokens {
                if s.contains(&token.token) {
                    *s = s.replace(&token.token, &token.original);
                }
            }
        }
        serde_json::Value::Array(items) => {
            for item in items {
                unredact_json_value(item, tokens);
            }
        }
        serde_json::Value::Object(map) => {
            for value in map.values_mut() {
                unredact_json_value(value, tokens);
            }
        }
        _ => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn policy(mode: RedactionMode, terms: &[&str]) -> RedactionPolicy {
        RedactionPolicy {
            mode,
            terms: terms.iter().map(|s| s.to_string()).collect(),
            preserve_numbers: true,
        }
    }

    #[test]
    fn off_mode_leaves_text_unchanged_and_produces_no_tokens() {
        let (masked, tokens) = redact_text(
            "Acme Corp reported a defect.",
            &policy(RedactionMode::Off, &["Acme Corp"]),
        );

        assert_eq!(masked, "Acme Corp reported a defect.");
        assert!(tokens.is_empty());
    }

    #[test]
    fn customers_mode_masks_a_configured_term() {
        let (masked, tokens) = redact_text(
            "Acme Corp reported a defect.",
            &policy(RedactionMode::Customers, &["Acme Corp"]),
        );

        assert_eq!(masked, "Customer A reported a defect.");
        assert_eq!(tokens.len(), 1);
        assert_eq!(tokens[0].original, "Acme Corp");
    }

    #[test]
    fn assigns_tokens_by_list_position_not_by_occurrence_order_in_text() {
        let (masked, _) = redact_text(
            "Beta Inc uses parts from Acme Corp.",
            &policy(RedactionMode::Customers, &["Acme Corp", "Beta Inc"]),
        );

        // "Acme Corp" is listed first, so it always gets "Customer A" —
        // even though "Beta Inc" appears first in this particular text.
        assert_eq!(masked, "Customer B uses parts from Customer A.");
    }

    #[test]
    fn a_longer_term_is_masked_before_a_shorter_term_that_is_its_substring() {
        let (masked, _) = redact_text(
            "Acme Corp and Acme both appear.",
            &policy(RedactionMode::Customers, &["Acme", "Acme Corp"]),
        );

        // Without longest-first matching, "Acme Corp" would be corrupted
        // into "<token for Acme> Corp" before its own, longer term ever
        // gets a chance to match.
        assert!(
            !masked.contains("Acme Corp"),
            "the longer term should be fully replaced: {masked}"
        );
    }

    #[test]
    fn blank_terms_are_skipped_and_do_not_consume_a_letter() {
        let (_, tokens) = redact_text(
            "irrelevant",
            &policy(RedactionMode::Customers, &["", "  ", "Acme Corp"]),
        );

        assert_eq!(tokens.len(), 1);
        assert_eq!(tokens[0].token, "Customer A");
    }

    #[test]
    fn unredact_restores_the_real_value_inside_a_nested_json_response() {
        let (_, tokens) = redact_text(
            "Acme Corp",
            &policy(RedactionMode::Customers, &["Acme Corp"]),
        );
        let mut value = serde_json::json!({
            "title": "Complaint from Customer A",
            "items": ["Customer A called", {"note": "Customer A again"}],
        });

        unredact_json_value(&mut value, &tokens);

        assert_eq!(value["title"], "Complaint from Acme Corp");
        assert_eq!(value["items"][0], "Acme Corp called");
        assert_eq!(value["items"][1]["note"], "Acme Corp again");
    }

    #[test]
    fn unredact_with_no_tokens_leaves_the_value_unchanged() {
        let mut value = serde_json::json!({"title": "Customer A stays as-is"});

        unredact_json_value(&mut value, &[]);

        assert_eq!(value["title"], "Customer A stays as-is");
    }
}
