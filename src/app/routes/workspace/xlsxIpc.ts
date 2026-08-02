import { invoke } from "@tauri-apps/api/core";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";

/** D-04: Rust only serializes this descriptor — no layout decision crosses this call. */
export function xlsxExport(descriptor: A3LayoutDescriptor, destPath: string): Promise<void> {
  return invoke<void>("xlsx_export", { descriptor, destPath });
}
