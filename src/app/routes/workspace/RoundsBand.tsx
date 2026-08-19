import { useState } from "react";
import { useTranslation } from "react-i18next";
import { buildOpenRoundCommand } from "../../../domain/commands";
import { roundOrdinal } from "../../../domain/selectors";
import { useProjectStore } from "../../../state";
import { Button, Input, Label } from "../../../ui";

/**
 * D-149(6d)/SPEC.md §1.2 S7: "if not met, the app offers a one-click
 * 'Return to Step 4' that creates a new analysis round while preserving
 * history." This is that one click — deliberately a manual, project-level
 * control rather than something wired to `resultVerdict`'s own payload:
 * `MethodEditorProps` carries only `{payload, onChange}` (no `dispatch`,
 * no `project.rounds`), so a plugin's Editor structurally cannot open a
 * round itself. Only Step 7 renders this band (`StepPage.tsx`) — rounds
 * iterate the step 4-7 loop, and Step 7 is where a verdict is recorded.
 */
export function RoundsBand() {
  const { t, i18n } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const readOnly = useProjectStore((s) => s.readOnly);
  const dispatch = useProjectStore((s) => s.dispatch);
  const [reason, setReason] = useState("");

  if (!project) {
    return null;
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(iso));

  function handleStart() {
    if (!project || reason.trim().length === 0) {
      return;
    }
    dispatch(buildOpenRoundCommand(project, reason.trim(), new Date().toISOString()));
    setReason("");
  }

  return (
    <section className="flex flex-col gap-3 rounded-control border border-border p-4">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
        {t("workspace.rounds.bandTitle")}
      </h2>

      {project.rounds.length === 0 ? (
        <p className="font-body text-sm text-ink-muted">{t("workspace.rounds.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {project.rounds.map((round) => (
            <li key={round.id} className="font-body text-sm text-ink">
              <span className="font-medium">{t("workspace.rounds.ordinal", { n: roundOrdinal(project.rounds, round.id) })}</span>
              {" — "}
              {round.reason} · {t("workspace.rounds.openedOn", { date: formatDate(round.openedAt) })}
              {round.closedAt && <> · {t("workspace.rounds.closedOn", { date: formatDate(round.closedAt) })}</>}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="round-reason">{t("workspace.rounds.reasonLabel")}</Label>
        <div className="flex gap-2">
          <Input
            id="round-reason"
            value={reason}
            placeholder={t("workspace.rounds.reasonPlaceholder")}
            onChange={(event) => setReason(event.target.value)}
            disabled={readOnly}
          />
          <Button onClick={handleStart} disabled={readOnly || reason.trim().length === 0}>
            {t("workspace.rounds.startNew")}
          </Button>
        </div>
      </div>
    </section>
  );
}
