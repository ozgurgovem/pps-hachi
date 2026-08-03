import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, Label, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from "../../ui";
import type { MethodEditorProps } from "../types";
import { FISHBONE_CATEGORY_IDS, FISHBONE_CATEGORY_SETS, categoryLabelKey } from "./categories";
import { FishboneDiagram } from "./FishboneDiagram";
import type { FishboneCategorySet } from "./categories";
import type { FishbonePayload } from "./schema";

function newCauseId(): string {
  return crypto.randomUUID();
}

/**
 * D-103: this phase's editor manages top-level causes and their position
 * (drag on the diagram) only — the schema supports one level of sub-cause
 * nesting for future use (imports, AI proposals), but exposing "add as a
 * sub-cause of X" in this UI is scoped out of Phase 5, not silently dropped.
 */
export function FishboneEditor({ payload, onChange }: MethodEditorProps<FishbonePayload>) {
  const { t } = useTranslation();
  const categoryIds = FISHBONE_CATEGORY_IDS[payload.categorySet];
  const [newCauseCategoryId, setNewCauseCategoryId] = useState(categoryIds[0] ?? "");
  const [newCauseText, setNewCauseText] = useState("");

  function changeCategorySet(categorySet: FishboneCategorySet) {
    const validIds = new Set(FISHBONE_CATEGORY_IDS[categorySet]);
    onChange({
      ...payload,
      categorySet,
      causes: payload.causes.filter((cause) => validIds.has(cause.categoryId)),
    });
    setNewCauseCategoryId(FISHBONE_CATEGORY_IDS[categorySet][0] ?? "");
  }

  function addCause() {
    if (newCauseText.trim().length === 0) {
      return;
    }
    onChange({
      ...payload,
      causes: [
        ...payload.causes,
        { id: newCauseId(), categoryId: newCauseCategoryId, text: newCauseText.trim() },
      ],
    });
    setNewCauseText("");
  }

  function removeCause(causeId: string) {
    onChange({
      ...payload,
      causes: payload.causes.filter((cause) => cause.id !== causeId && cause.parentCauseId !== causeId),
    });
  }

  function moveCause(causeId: string, position: { x: number; y: number }) {
    onChange({
      ...payload,
      causes: payload.causes.map((cause) => (cause.id === causeId ? { ...cause, position } : cause)),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fishbone-category-set">{t("methods.fishbone.categorySetLabel")}</Label>
        <SelectRoot value={payload.categorySet} onValueChange={changeCategorySet}>
          <SelectTrigger id="fishbone-category-set">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FISHBONE_CATEGORY_SETS.map((set) => (
              <SelectItem key={set} value={set}>
                {set}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </div>

      <div className="h-72 rounded-control border border-border">
        <FishboneDiagram payload={payload} interactive onCausePositionChange={moveCause} />
      </div>

      <div className="flex flex-col gap-2">
        {payload.causes
          .filter((cause) => !cause.parentCauseId)
          .map((cause) => (
            <div key={cause.id} className="flex items-center justify-between gap-2 rounded-control border border-border px-3 py-2">
              <span className="font-body text-sm text-ink">
                {t(categoryLabelKey(cause.categoryId))} — {cause.text}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCause(cause.id)}
                aria-label={t("methods.fishbone.removeCause")}
              >
                ✕
              </Button>
            </div>
          ))}
      </div>

      <div className="flex items-end gap-2">
        <div className="flex w-40 flex-col gap-1.5">
          <Label htmlFor="fishbone-new-cause-category">{t("methods.fishbone.categoryLabel")}</Label>
          <SelectRoot value={newCauseCategoryId} onValueChange={setNewCauseCategoryId}>
            <SelectTrigger id="fishbone-new-cause-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryIds.map((categoryId) => (
                <SelectItem key={categoryId} value={categoryId}>
                  {t(categoryLabelKey(categoryId))}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="fishbone-new-cause-text">{t("methods.fishbone.causeLabel")}</Label>
          <Input
            id="fishbone-new-cause-text"
            value={newCauseText}
            onChange={(event) => setNewCauseText(event.target.value)}
          />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addCause}>
          {t("methods.fishbone.addCause")}
        </Button>
      </div>
    </div>
  );
}
