import { describe, expect, it } from "vitest";
import i18n from "../../../i18n";
import { errorMessage } from "./errorMessage";

/**
 * The Rust half of this contract lives in `src-tauri/src/source_file.rs`
 * (`the_cloud_marker_is_the_code_a_colon_and_the_bare_file_name`). Both
 * sides pin the same wire format on purpose: a marker only one side knows
 * about is a marker that silently stops working.
 */
describe("errorMessage", () => {
  it("passes an ordinary error through unchanged", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
    expect(errorMessage("plain string")).toBe("plain string");
  });

  it("turns the cloud-placeholder marker into real guidance naming the file", async () => {
    await i18n.changeLanguage("en");
    const message = errorMessage(new Error("CLOUD_FILE_UNAVAILABLE:PHOTO-2025-02-27-20-56-49.jpg"));

    expect(message).toContain("PHOTO-2025-02-27-20-56-49.jpg");
    // The raw marker never reaches the user.
    expect(message).not.toContain("CLOUD_FILE_UNAVAILABLE");
    // And it says what to DO, not just what failed.
    expect(message.toLowerCase()).toContain("download");
  });

  it("renders that guidance in Turkish when the UI is Turkish", async () => {
    await i18n.changeLanguage("tr");
    const message = errorMessage(new Error("CLOUD_FILE_UNAVAILABLE:rapor.xlsx"));

    expect(message).toContain("rapor.xlsx");
    expect(message).toContain("bulutta");
    await i18n.changeLanguage("en");
  });

  it("never mistakes an ordinary message that merely mentions the phrase", () => {
    const message = errorMessage(new Error("could not parse CLOUD_FILE_UNAVAILABLE: header"));
    expect(message).toBe("could not parse CLOUD_FILE_UNAVAILABLE: header");
  });
});
