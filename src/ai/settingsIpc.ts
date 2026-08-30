import { invoke } from "@tauri-apps/api/core";

/** Mirrors `src-tauri/src/ai/provider.rs::ConnectionStatus`. */
export interface ConnectionStatus {
  success: boolean;
  latencyMs: number;
  error: string | null;
}

/** Mirrors `src-tauri/src/ai/provider.rs::ModelInfo` — `id` is
 * `"{llm_name}/{llm_group_name}"`, opaque to the frontend beyond that. */
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
}

/** Mirrors `src-tauri/src/ai/settings.rs::AiSettings` — never the key
 * itself (D-14), only non-secret preferences. */
export interface AiSettings {
  enabled: boolean;
  defaultModelId: string | null;
  fastModelId: string | null;
}

/**
 * D-14: the raw key crosses this one, unavoidable IPC hop from the paste
 * field to Rust's keychain write — it goes no further. The resolved value is
 * only ever a masked preview (`"nk_live_…d41d"`), never the key in full.
 */
export function setApiKey(key: string): Promise<string> {
  return invoke<string>("ai_set_key", { key });
}

/** `null` means no key is configured. */
export function getKeyStatus(): Promise<string | null> {
  return invoke<string | null>("ai_key_status");
}

export function removeApiKey(): Promise<void> {
  return invoke<void>("ai_remove_key");
}

/** SPEC.md §8.3's "smallest possible real request" — never rejects for a
 * provider-side or network failure, see `ConnectionStatus.error`. */
export function testConnection(modelId: string): Promise<ConnectionStatus> {
  return invoke<ConnectionStatus>("ai_test_connection", { modelId });
}

/** D-21: never hardcoded — always the live result of this call. */
export function listModels(): Promise<ModelInfo[]> {
  return invoke<ModelInfo[]>("ai_list_models");
}

export function getAiSettings(): Promise<AiSettings> {
  return invoke<AiSettings>("ai_get_settings");
}

export function setAiSettings(settings: AiSettings): Promise<void> {
  return invoke<void>("ai_set_settings", { settings });
}
