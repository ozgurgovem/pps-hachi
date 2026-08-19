import type { Round } from "../model";

/**
 * D-58: `rounds` is append-only (`buildOpenRoundCommand` only ever pushes),
 * so array position is already creation order — no separate ordinal field
 * is stored. Used for the "Tur N" label on round pickers/badges.
 */
export function roundOrdinal(rounds: readonly Round[], roundId: string): number | undefined {
  const index = rounds.findIndex((round) => round.id === roundId);
  return index === -1 ? undefined : index + 1;
}

/** A round is open while it has no `closedAt` — `buildOpenRoundCommand` closes the previous one before appending a new one, so at most one is ever open. */
export function findOpenRound(rounds: readonly Round[]): Round | undefined {
  return rounds.find((round) => round.closedAt === undefined);
}
