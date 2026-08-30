use super::error::AiError;

const SERVICE_NAME: &str = "pps-hachi";
const ACCOUNT_NAME: &str = "vorion-api-key";

/// D-200: abstraction over "wherever the OS keychain lives" so unit tests
/// never touch the real macOS Keychain / Windows Credential Manager — writing
/// a brand-new item there from a non-interactive `cargo test` run risks a
/// permission-prompt hang with no user present to click through it, the same
/// class of gap D-134 found ("nothing short of a human clicking a real button
/// exercises a real ACL"). Production code always uses `KeyringSecretStore`;
/// tests use `fake::FakeSecretStore`. Mirrors the Repository Pattern already
/// used elsewhere in this codebase (`LlmProvider` itself, one module over).
pub trait SecretStore {
    fn set(&self, secret: &str) -> Result<(), AiError>;
    fn get(&self) -> Result<Option<String>, AiError>;
    fn delete(&self) -> Result<(), AiError>;
}

/// D-14: the real OS keychain via the `keyring` crate's `v1` feature
/// (default) — covers macOS Keychain + Windows Credential Manager, which is
/// all this app targets (verified against the crate's own Cargo.toml, not
/// memory — D-200). `Entry::new` itself can fail (e.g. no platform backend
/// compiled in); that failure is as real as a set/get/delete failure, so it
/// flows through the same `Result<_, AiError>`.
pub struct KeyringSecretStore;

impl SecretStore for KeyringSecretStore {
    fn set(&self, secret: &str) -> Result<(), AiError> {
        entry()?.set_password(secret)?;
        Ok(())
    }

    fn get(&self) -> Result<Option<String>, AiError> {
        match entry()?.get_password() {
            Ok(secret) => Ok(Some(secret)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(other) => Err(other.into()),
        }
    }

    fn delete(&self) -> Result<(), AiError> {
        match entry()?.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(other) => Err(other.into()),
        }
    }
}

fn entry() -> Result<keyring::Entry, AiError> {
    Ok(keyring::Entry::new(SERVICE_NAME, ACCOUNT_NAME)?)
}

/// SPEC.md §8.3: "the UI shows a key as `sk-ant-…4f2a` after saving and can
/// never display it in full again." Same shape for Vorion's `nk_live_...`
/// keys — enough of the prefix to recognise the key family, enough of the
/// suffix to tell two saved keys apart, never enough of either to
/// reconstruct the key. Never panics on a short/malformed input: an
/// unexpectedly short string just gets fully masked rather than this
/// function becoming a new place a key could leak via a panic message.
pub fn masked_preview(secret: &str) -> String {
    let chars: Vec<char> = secret.chars().collect();
    const PREFIX_LEN: usize = 8;
    const SUFFIX_LEN: usize = 4;
    if chars.len() < PREFIX_LEN + SUFFIX_LEN + 1 {
        return "•".repeat(chars.len());
    }
    let prefix: String = chars[..PREFIX_LEN].iter().collect();
    let suffix: String = chars[chars.len() - SUFFIX_LEN..].iter().collect();
    format!("{prefix}…{suffix}")
}

#[cfg(test)]
pub(crate) mod fake {
    use super::{AiError, SecretStore};
    use std::cell::RefCell;

    /// In-memory stand-in for the OS keychain, used by every test in this
    /// crate that needs a `SecretStore` — never `KeyringSecretStore`.
    #[derive(Default)]
    pub struct FakeSecretStore {
        value: RefCell<Option<String>>,
    }

    impl SecretStore for FakeSecretStore {
        fn set(&self, secret: &str) -> Result<(), AiError> {
            *self.value.borrow_mut() = Some(secret.to_string());
            Ok(())
        }

        fn get(&self) -> Result<Option<String>, AiError> {
            Ok(self.value.borrow().clone())
        }

        fn delete(&self) -> Result<(), AiError> {
            *self.value.borrow_mut() = None;
            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn masked_preview_hides_the_middle_of_a_realistic_key() {
        let masked = masked_preview("nk_live_abcdefghijklmnopqrstuvwxyzd41d");
        assert_eq!(masked, "nk_live_…d41d");
        assert!(!masked.contains("abcdefghijklmnopqrstuvwxyz"));
    }

    #[test]
    fn masked_preview_fully_masks_a_short_string_instead_of_panicking() {
        let masked = masked_preview("short");
        assert_eq!(masked, "•••••");
        assert!(!masked.contains("short"));
    }

    #[test]
    fn masked_preview_fully_masks_an_empty_string() {
        assert_eq!(masked_preview(""), "");
    }
}
