import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SignOffEntry } from "../../../domain/model";
import { buildSetSignOffCommand } from "../../../domain/commands";
import { useProjectStore } from "../../../state";
import { Button, Input, Label } from "../../../ui";

type SignOffRole = "preparedBy" | "reviewedBy" | "approvedBy";
const ROLES: readonly SignOffRole[] = ["preparedBy", "reviewedBy", "approvedBy"];

/**
 * D-149(6d)/SPEC.md §1.3 (Step 8): "Closure & sign-off (prepared by,
 * reviewed by, approved by, date)." No accounts exist in this app (D-56),
 * so a "signature" is a typed name, not an authenticated identity — the
 * same posture `meta.owner`/`meta.team` already have.
 */
export function SignOffPanel() {
  const { t, i18n } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const readOnly = useProjectStore((s) => s.readOnly);
  const dispatch = useProjectStore((s) => s.dispatch);

  if (!project) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3 rounded-control border border-border p-4">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
        {t("workspace.signOff.title")}
      </h2>
      {ROLES.map((role) => (
        <SignOffRow
          key={role}
          role={role}
          entry={project.signOff[role]}
          readOnly={readOnly}
          locale={i18n.language}
          onSign={(entry) => dispatch(buildSetSignOffCommand(project, role, entry))}
          onClear={() => dispatch(buildSetSignOffCommand(project, role, undefined))}
        />
      ))}
    </section>
  );
}

interface SignOffRowProps {
  role: SignOffRole;
  entry: SignOffEntry | undefined;
  readOnly: boolean;
  locale: string;
  onSign: (entry: SignOffEntry) => void;
  onClear: () => void;
}

function SignOffRow({ role, entry, readOnly, locale, onSign, onClear }: SignOffRowProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  if (entry) {
    const signedAt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(entry.signedAt));
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="font-body text-sm text-ink">
          <span className="font-medium">{t(`workspace.signOff.${role}`)}:</span> {entry.name} ·{" "}
          {t("workspace.signOff.signedOn", { date: signedAt })}
        </span>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={readOnly}>
          {t("workspace.signOff.unsign")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`sign-off-${role}`}>{t(`workspace.signOff.${role}`)}</Label>
      <div className="flex gap-2">
        <Input
          id={`sign-off-${role}`}
          value={name}
          placeholder={t("workspace.signOff.namePlaceholder")}
          onChange={(event) => setName(event.target.value)}
          disabled={readOnly}
        />
        <Button
          onClick={() => {
            onSign({ name: name.trim(), signedAt: new Date().toISOString() });
            setName("");
          }}
          disabled={readOnly || name.trim().length === 0}
        >
          {t("workspace.signOff.sign")}
        </Button>
      </div>
    </div>
  );
}
