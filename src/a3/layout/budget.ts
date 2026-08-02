import type { A3Template, TemplateBlock } from "../templates/types";

export interface BlockBudget {
  readonly budgetPt: number;
  /** One user-authored text line per content row — see templates/types.ts's bodyRowHeightPt note. */
  readonly rowCount: number;
}

/** The printed cell budget for one block, straight from the template's own row table (SPEC.md §2.3). */
export function computeBlockBudget(template: A3Template, block: TemplateBlock): BlockBudget {
  const rows = template.rows.filter(
    (row) => row.index >= block.contentRows.start && row.index <= block.contentRows.end,
  );
  const budgetPt = rows.reduce((total, row) => total + row.heightPt, 0);
  return { budgetPt, rowCount: rows.length };
}
