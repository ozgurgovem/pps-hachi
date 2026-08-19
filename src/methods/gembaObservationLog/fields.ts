import type { FieldFormField } from "../shared/fieldForm";

export type GembaObservationLogFieldKey = "date" | "place" | "observer" | "whatWasSeen";

export const GEMBA_OBSERVATION_LOG_FIELDS = [
  {
    key: "date",
    labelKey: "methods.gembaObservationLog.fields.date",
    exportLabel: { tr: "Tarih", en: "Date" },
    type: "date",
  },
  {
    key: "place",
    labelKey: "methods.gembaObservationLog.fields.place",
    exportLabel: { tr: "Yer", en: "Place" },
    type: "text",
  },
  {
    key: "observer",
    labelKey: "methods.gembaObservationLog.fields.observer",
    exportLabel: { tr: "Gözlemci", en: "Observer" },
    type: "text",
  },
  {
    key: "whatWasSeen",
    labelKey: "methods.gembaObservationLog.fields.whatWasSeen",
    exportLabel: { tr: "Gözlenen", en: "What was seen" },
    type: "textarea",
    wide: true,
  },
] as const satisfies readonly FieldFormField<GembaObservationLogFieldKey>[];
