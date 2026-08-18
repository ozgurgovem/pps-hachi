import { describe, expect, it } from "vitest";
import type { TrajectoryChartSpec } from "../chartSpec";
import { renderSmartTargetToA3 } from "./renderToA3";
import type { SmartTargetPayload } from "./schema";

describe("renderSmartTargetToA3 (D-38 three-zone strip)", () => {
  const payload: SmartTargetPayload = {
    metric: "Gürültü PPM",
    baseline: 120,
    target: 20,
    unit: "PPM",
    dueDate: "2026-09-01",
    owner: "Ayşe Yılmaz",
    prioritizedItems: [{ id: "i1", text: "Panel rezonansını azalt" }],
    stakeholderNote: "Üretim müdürü onayladı.",
  };

  it("emits exactly three zones — prioritised items, chart, mono commitment line — and no top-level lines", () => {
    const content = renderSmartTargetToA3(payload, { id: "e1", title: "Hedef" });

    expect(content.lines).toEqual([]);
    expect(content.zones).toHaveLength(3);
    expect(content.zones!.reduce((sum, zone) => sum + zone.widthFraction, 0)).toBeCloseTo(1);
  });

  it("zone A carries the entry title and every prioritised item", () => {
    const content = renderSmartTargetToA3(payload, { id: "e1", title: "Hedef" });
    const zoneA = content.zones![0]!;
    expect(zoneA.lines?.map((l) => l.text)).toEqual(["Hedef", "• Panel rezonansını azalt"]);
  });

  it("zone B carries a trajectory-chart image spec built from baseline/target", () => {
    const content = renderSmartTargetToA3(payload, { id: "e1", title: "Hedef" });
    const zoneB = content.zones![1]!;
    expect(zoneB.image?.kind).toBe("trajectory-chart");

    const spec = zoneB.image?.spec as TrajectoryChartSpec;
    expect(spec.baseline).toEqual({ label: "Baseline", value: 120 });
    expect(spec.target).toEqual({ label: "Target", value: 20 });
    expect(spec.unit).toBe("PPM");
  });

  it("zone C carries one mono line with baseline · target · unit · due date · owner, in that order", () => {
    const content = renderSmartTargetToA3(payload, { id: "e1", title: "Hedef" });
    const zoneC = content.zones![2]!;
    expect(zoneC.lines).toEqual([
      { text: "Baseline: 120 · Target: 20 · Unit: PPM · Due: 2026-09-01 · Owner: Ayşe Yılmaz" },
    ]);
  });

  /** D-188/P-26: `entry.language` picks the commitment-line labels and the chart's baseline/target point labels. */
  it("uses Turkish labels when the entry's language is tr", () => {
    const content = renderSmartTargetToA3(payload, { id: "e1", title: "Hedef", language: "tr" });

    const zoneB = content.zones![1]!;
    const spec = zoneB.image?.spec as TrajectoryChartSpec;
    expect(spec.baseline).toEqual({ label: "Başlangıç", value: 120 });
    expect(spec.target).toEqual({ label: "Hedef", value: 20 });

    const zoneC = content.zones![2]!;
    expect(zoneC.lines).toEqual([
      { text: "Başlangıç: 120 · Hedef: 20 · Birim: PPM · Bitiş: 2026-09-01 · Sorumlu: Ayşe Yılmaz" },
    ]);
  });
});
