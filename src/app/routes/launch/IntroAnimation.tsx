import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import farplasMarkUrl from "../../../assets/intro/farplas-mark.png";
import problemSolvingUrl from "../../../assets/intro/problem-solving.png";
import paretoAnalysisUrl from "../../../assets/intro/pareto-analysis.png";
import fiveW1HUrl from "../../../assets/intro/5w1h.png";
import fishboneDiagramUrl from "../../../assets/intro/fishbone-diagram.png";
import correctiveActionPanelUrl from "../../../assets/intro/corrective-action.png";
import fiveWhyUrl from "../../../assets/intro/5-why.png";
import standardsUrl from "../../../assets/intro/standards.png";

/**
 * Ported from Barış's own second Claude Design revision
 * (`PPS-Hachi Homepage.dc.html`, 2026-09-16) — a grid-based relayout of the
 * original free-floating intro, addressing his own real report that the
 * climax reveal overlapped illegibly with still-visible floating text. Two
 * structural fixes over the first port, both from the new source directly:
 * (1) the eight PPS/engineering phrases (plus the logo and three small
 * method-diagram sketches) now sit in a fixed 3-col/4-row CSS grid, one per
 * cell — spatially non-overlapping by construction, not by hand-tuned
 * timing; (2) every element carries exactly ONE `animation` shorthand — a
 * drifting wrapper and its fading child are two separate nodes, never one
 * node combining two animations via longhand properties, which is what
 * actually caused D-…'s duration-clobbering bug the first time. Seven real
 * method-illustration images (`src/assets/intro/`, downscaled from the
 * design's own originals — decorative background art, always shown heavily
 * blurred/faded via `intro-fx-soft`, never at full legibility) plus the
 * real Farplas mark (`intro-fx-logo`) round out the sequence.
 */

const DURATION_MS = 20100;

const BG = "#3b3d42";
const WHITE = "#ffffff";
/** 5.23:1 against BG — safe at any text size. */
const TEAL = "#59c2d6";
/** 3.91:1 against BG — large text only (>=24px regular or >=18.66px bold); every text-shadowed grid phrase is large. */
const TEAL_DEEP = "#3fa8bd";
/** 3.65:1 against BG — large text/graphical-object only. */
const RED = "#ef6b78";
/** 8.63:1 against BG — the one small piece of real text in this overlay (the skip button). */
const MUTED_TEXT = "#e4e5e9";
const MUTED_ON_DARK = "rgba(255,255,255,0.8)";
/** Matches the source design's own glow — the real fix for legibility over a busy, drifting background, not a Farplas token (this shadow only ever sits on this overlay's own fixed-dark background). */
const TEXT_SHADOW = "0 2px 18px rgba(20,22,24,0.85)";

type DriftPreset = "a" | "b" | "c" | "d";

function driftAnimation(preset: DriftPreset, durationS: number): string {
  return `intro-drift-${preset} ${durationS}s linear 0s both`;
}

interface DriftWrapProps {
  gridArea?: string;
  justify?: "start" | "end";
  left?: string;
  top?: string;
  width?: string;
  drift: DriftPreset;
  driftDurationS: number;
  children: React.ReactNode;
}

/** A drift-only wrapper — never carries any other animation, so it can never collide with its child's own fade. */
function DriftWrap({ gridArea, justify, left, top, width, drift, driftDurationS, children }: DriftWrapProps) {
  return (
    <div
      style={{
        gridArea,
        left,
        top,
        width,
        position: gridArea ? undefined : "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent: gridArea ? (justify === "end" ? "flex-end" : "flex-start") : undefined,
        minWidth: gridArea ? 0 : undefined,
        animation: driftAnimation(drift, driftDurationS),
      }}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── Grid layer (text, logo, mini-diagrams) ───────────────────────── */

type GridCellContent =
  | { kind: "text"; textKey: string; fontSizePx: number; color: string }
  | { kind: "logo" }
  | { kind: "beforeAfter" }
  | { kind: "impactEffort" }
  | { kind: "gapAnalysis" };

interface GridCellSpec {
  key: string;
  gridArea: string;
  justify: "start" | "end";
  drift: DriftPreset;
  driftDurationS: number;
  delayS: number;
  content: GridCellContent;
}

const GRID_CELLS: readonly GridCellSpec[] = [
  {
    key: "problemDefinition",
    gridArea: "1 / 1 / 2 / 3",
    justify: "start",
    drift: "a",
    driftDurationS: 26,
    delayS: 0.8,
    content: { kind: "text", textKey: "problemDefinition", fontSizePx: 34, color: WHITE },
  },
  {
    key: "logo",
    gridArea: "1 / 3 / 2 / 4",
    justify: "end",
    drift: "b",
    driftDurationS: 30,
    delayS: 2.0,
    content: { kind: "logo" },
  },
  {
    key: "beforeAfter",
    gridArea: "2 / 1 / 3 / 2",
    justify: "start",
    drift: "c",
    driftDurationS: 34,
    delayS: 1.85,
    content: { kind: "beforeAfter" },
  },
  {
    key: "rootCause",
    gridArea: "2 / 2 / 3 / 4",
    justify: "end",
    drift: "d",
    driftDurationS: 22,
    delayS: 2.9,
    content: { kind: "text", textKey: "rootCause", fontSizePx: 44, color: TEAL },
  },
  {
    key: "correctiveAction",
    gridArea: "3 / 1 / 4 / 3",
    justify: "start",
    drift: "b",
    driftDurationS: 26,
    delayS: 3.95,
    content: { kind: "text", textKey: "correctiveAction", fontSizePx: 30, color: WHITE },
  },
  {
    key: "impactEffort",
    gridArea: "3 / 3 / 4 / 4",
    justify: "end",
    drift: "a",
    driftDurationS: 30,
    delayS: 5.0,
    content: { kind: "impactEffort" },
  },
  {
    key: "engineering",
    gridArea: "4 / 1 / 5 / 2",
    justify: "start",
    drift: "d",
    driftDurationS: 34,
    delayS: 6.05,
    content: { kind: "text", textKey: "engineering", fontSizePx: 22, color: MUTED_ON_DARK },
  },
  {
    key: "pdca",
    gridArea: "4 / 2 / 5 / 4",
    justify: "end",
    drift: "c",
    driftDurationS: 22,
    delayS: 7.1,
    content: { kind: "text", textKey: "pdca", fontSizePx: 21, color: MUTED_ON_DARK },
  },
  {
    key: "aiPowered",
    gridArea: "1 / 1 / 2 / 3",
    justify: "start",
    drift: "a",
    driftDurationS: 26,
    delayS: 8.15,
    content: { kind: "text", textKey: "aiPowered", fontSizePx: 32, color: TEAL },
  },
  {
    key: "aiCollaboration",
    gridArea: "1 / 3 / 2 / 4",
    justify: "end",
    drift: "b",
    driftDurationS: 30,
    delayS: 9.2,
    content: { kind: "text", textKey: "aiCollaboration", fontSizePx: 22, color: WHITE },
  },
  {
    key: "gapAnalysis",
    gridArea: "2 / 1 / 3 / 2",
    justify: "start",
    drift: "c",
    driftDurationS: 34,
    delayS: 10.25,
    content: { kind: "gapAnalysis" },
  },
  {
    key: "standardization",
    gridArea: "2 / 2 / 3 / 4",
    justify: "end",
    drift: "d",
    driftDurationS: 22,
    delayS: 11.3,
    content: { kind: "text", textKey: "standardization", fontSizePx: 19, color: TEAL_DEEP },
  },
];

function TextCell({ textKey, fontSizePx, color }: { textKey: string; fontSizePx: number; color: string }) {
  const { t } = useTranslation();
  return (
    <div
      aria-hidden="true"
      className="font-fp-display font-bold uppercase whitespace-nowrap"
      style={{ fontSize: fontSizePx, color, textShadow: TEXT_SHADOW }}
    >
      {t(`launch.intro.words.${textKey}`)}
    </div>
  );
}

function LogoCell() {
  return <img src={farplasMarkUrl} alt="Farplas" style={{ height: 34, width: "auto", display: "block" }} />;
}

const DOT = { width: 6, height: 6 } as const;

function BeforeAfterCell() {
  const { t } = useTranslation();
  const before = [
    [0, 28],
    [13, 48],
    [26, 24],
    [39, 54],
    [52, 32],
    [65, 58],
  ];
  const after = [
    [86, 36],
    [99, 40],
    [112, 38],
    [125, 37],
    [138, 39],
    [151, 38],
  ];
  return (
    <div aria-hidden="true" className="flex flex-col gap-2" style={{ width: 176 }}>
      <div className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="font-mono text-xs font-bold tracking-[0.08em]" style={{ color: TEAL }}>
          07
        </span>
        <span className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: WHITE }}>
          {t("launch.intro.miniCharts.beforeAfter")}
        </span>
      </div>
      <div className="relative" style={{ width: 176, height: 88 }}>
        <span className="absolute bottom-0 left-0 block h-px" style={{ width: 170, background: "rgba(255,255,255,0.32)" }} />
        <span className="absolute bottom-0 left-0 block w-px" style={{ height: 88, background: "rgba(255,255,255,0.32)" }} />
        <span className="absolute left-0 block h-px" style={{ bottom: 64, width: 170, background: "rgba(255,255,255,0.20)" }} />
        <span className="absolute left-0 block h-px" style={{ bottom: 14, width: 170, background: "rgba(255,255,255,0.20)" }} />
        <span className="absolute block w-px" style={{ left: 80, bottom: 0, height: 88, background: RED, opacity: 0.55 }} />
        {before.map(([left, bottom]) => (
          <span key={`b-${left}`} className="absolute block" style={{ left, bottom, ...DOT, background: RED }} />
        ))}
        {after.map(([left, bottom]) => (
          <span key={`a-${left}`} className="absolute block" style={{ left, bottom, ...DOT, background: TEAL }} />
        ))}
      </div>
    </div>
  );
}

function ImpactEffortCell() {
  const { t } = useTranslation();
  return (
    <div aria-hidden="true" className="flex flex-col gap-2" style={{ width: 150 }}>
      <div className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="font-mono text-xs font-bold tracking-[0.08em]" style={{ color: TEAL }}>
          06
        </span>
        <span className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: WHITE }}>
          {t("launch.intro.miniCharts.impactEffort")}
        </span>
      </div>
      <div className="grid grid-cols-2 grid-rows-2" style={{ width: 140, height: 92 }}>
        <span className="relative block border" style={{ borderColor: "rgba(255,255,255,0.20)" }}>
          <span className="absolute block" style={{ right: 8, bottom: 8, width: 14, height: 14, background: TEAL }} />
        </span>
        <span className="block border" style={{ borderColor: "rgba(255,255,255,0.20)" }} />
        <span className="block border" style={{ borderColor: "rgba(255,255,255,0.20)" }} />
        <span className="relative block border" style={{ borderColor: "rgba(255,255,255,0.20)" }}>
          <span className="absolute block" style={{ left: 10, top: 10, width: 9, height: 9, background: RED }} />
        </span>
      </div>
      <span className="text-xs font-bold tracking-[0.1em]" style={{ color: WHITE }}>
        {t("launch.intro.miniCharts.effort")}
      </span>
    </div>
  );
}

function GapAnalysisCell() {
  const { t } = useTranslation();
  const actualDots = [
    [6, 52],
    [30, 48],
    [54, 54],
    [78, 43],
    [102, 46],
    [126, 38],
  ];
  return (
    <div aria-hidden="true" className="flex flex-col gap-2" style={{ width: 224 }}>
      <div className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="font-mono text-xs font-bold tracking-[0.08em]" style={{ color: TEAL }}>
          03
        </span>
        <span className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: WHITE }}>
          {t("launch.intro.miniCharts.gapAnalysis")}
        </span>
      </div>
      <div className="relative" style={{ width: 224, height: 96 }}>
        <span className="absolute bottom-0 left-0 block h-px" style={{ width: 140, background: "rgba(255,255,255,0.32)" }} />
        <span className="absolute bottom-0 left-0 block w-px" style={{ height: 96, background: "rgba(255,255,255,0.32)" }} />
        <span className="absolute left-0 block h-px" style={{ bottom: 20, width: 140, background: TEAL }} />
        <span className="absolute left-0 block" style={{ bottom: 20, width: 140, height: 26, background: RED, opacity: 0.16 }} />
        {actualDots.map(([left, bottom]) => (
          <span
            key={left}
            className="absolute block"
            style={{ left, bottom, width: 8, height: 8, background: RED }}
          />
        ))}
        <span className="absolute text-xs font-bold tracking-[0.1em]" style={{ left: 150, bottom: 48, color: WHITE }}>
          {t("launch.intro.miniCharts.actual")}
        </span>
        <span className="absolute text-xs font-bold tracking-[0.1em]" style={{ left: 150, bottom: 14, color: TEAL }}>
          {t("launch.intro.miniCharts.target")}
        </span>
      </div>
    </div>
  );
}

function GridCellContentView({ content }: { content: GridCellContent }) {
  switch (content.kind) {
    case "text":
      return <TextCell textKey={content.textKey} fontSizePx={content.fontSizePx} color={content.color} />;
    case "logo":
      return <LogoCell />;
    case "beforeAfter":
      return <BeforeAfterCell />;
    case "impactEffort":
      return <ImpactEffortCell />;
    case "gapAnalysis":
      return <GapAnalysisCell />;
  }
}

function GridCell({ cell }: { cell: GridCellSpec }) {
  const isLogo = cell.content.kind === "logo";
  const fadeAnimation = isLogo
    ? `intro-fx-logo 4.4s cubic-bezier(0.33,0,0.25,1) ${cell.delayS}s both`
    : `intro-fade-window 4.0s cubic-bezier(0.33,0,0.25,1) ${cell.delayS}s both`;
  return (
    <DriftWrap gridArea={cell.gridArea} justify={cell.justify} drift={cell.drift} driftDurationS={cell.driftDurationS}>
      <div style={{ animation: fadeAnimation }}>
        <GridCellContentView content={cell.content} />
      </div>
    </DriftWrap>
  );
}

/* ───────────────────────── Background artifact panels (real method illustrations) ───────────────────────── */

interface ArtifactPanelSpec {
  key: string;
  leftPct: number;
  topPct: number;
  maxWidthPx: number;
  drift: DriftPreset;
  driftDurationS: number;
  delayS: number;
  numberLabel: string;
  captionKey: string;
  imageUrl: string;
}

const ARTIFACT_PANELS: readonly ArtifactPanelSpec[] = [
  { key: "problemSolving", leftPct: 5, topPct: 12, maxWidthPx: 400, drift: "a", driftDurationS: 30, delayS: 0.5, numberLabel: "01", captionKey: "problemSolving", imageUrl: problemSolvingUrl },
  { key: "paretoAnalysis", leftPct: 46, topPct: 8, maxWidthPx: 450, drift: "b", driftDurationS: 34, delayS: 2.25, numberLabel: "02", captionKey: "paretoAnalysis", imageUrl: paretoAnalysisUrl },
  { key: "fiveW1H", leftPct: 10, topPct: 42, maxWidthPx: 360, drift: "c", driftDurationS: 28, delayS: 4.0, numberLabel: "01", captionKey: "fiveW1H", imageUrl: fiveW1HUrl },
  { key: "fishboneDiagram", leftPct: 42, topPct: 50, maxWidthPx: 480, drift: "d", driftDurationS: 36, delayS: 5.75, numberLabel: "04", captionKey: "fishboneDiagram", imageUrl: fishboneDiagramUrl },
  { key: "correctiveActionPanel", leftPct: 7, topPct: 58, maxWidthPx: 390, drift: "b", driftDurationS: 32, delayS: 7.5, numberLabel: "05", captionKey: "correctiveAction", imageUrl: correctiveActionPanelUrl },
  { key: "fiveWhy", leftPct: 50, topPct: 20, maxWidthPx: 390, drift: "a", driftDurationS: 30, delayS: 9.25, numberLabel: "04", captionKey: "fiveWhy", imageUrl: fiveWhyUrl },
  { key: "standards", leftPct: 18, topPct: 30, maxWidthPx: 500, drift: "c", driftDurationS: 34, delayS: 11.0, numberLabel: "08", captionKey: "standards", imageUrl: standardsUrl },
];

function ArtifactPanel({ panel }: { panel: ArtifactPanelSpec }) {
  const { t } = useTranslation();
  return (
    <div
      aria-hidden="true"
      className="absolute"
      style={{
        left: `${panel.leftPct}%`,
        top: `${panel.topPct}%`,
        width: `min(${panel.maxWidthPx}px, 48vw)`,
        animation: driftAnimation(panel.drift, panel.driftDurationS),
      }}
    >
      <div style={{ animation: `intro-fx-soft 5.6s cubic-bezier(0.33,0,0.25,1) ${panel.delayS}s both` }}>
        <div className="mb-2 flex items-baseline gap-2 whitespace-nowrap">
          <span className="font-mono text-xs font-bold tracking-[0.08em]" style={{ color: TEAL }}>
            {panel.numberLabel}
          </span>
          <span className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: "rgba(255,255,255,0.9)" }}>
            {t(`launch.intro.panels.${panel.captionKey}`)}
          </span>
        </div>
        <img
          src={panel.imageUrl}
          alt={t(`launch.intro.panels.${panel.captionKey}`)}
          style={{ display: "block", width: "100%", height: "auto" }}
        />
      </div>
    </div>
  );
}

/* ───────────────────────── Overlay shell ───────────────────────── */

export interface IntroAnimationProps {
  onFinish: () => void;
}

/**
 * The overlay's own click-to-skip target — a real `<button>`, not a bare
 * `onClick` on a `div`, so it stays reachable by keyboard (Tab+Enter) as
 * well as a pointer, matching CLAUDE.md's quality-floor requirement (the
 * source design's own click-anywhere-to-skip has no keyboard equivalent).
 * Focused on mount so a keyboard/screen-reader user is never stranded
 * inside a 20-second animation with no operable control. Kept small and in
 * plain sentence case (2026-09-16, Barış's own follow-up — the original
 * all-caps "GEÇMEK İÇİN TIKLAYIN VEYA ESC'E BASIN" read too large/long).
 */
export function IntroAnimation({ onFinish }: IntroAnimationProps) {
  const { t } = useTranslation();
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    skipButtonRef.current?.focus();
    const timer = window.setTimeout(onFinish, DURATION_MS);
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onFinish();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-[90] cursor-pointer overflow-hidden font-body"
      style={{ background: BG }}
      onClick={onFinish}
    >
      <div className="absolute inset-0" style={{ animation: "intro-overlay-out 0.5s linear 19.6s both" }}>
        {/* Two diagonal wipe-in guide stripes, behind everything. */}
        <span
          aria-hidden="true"
          className="absolute block"
          style={{
            left: "16%",
            top: "10%",
            width: 34,
            height: "48vh",
            background: TEAL,
            opacity: 0.06,
            transform: "rotate(15deg)",
            animation: "intro-draw 3.2s cubic-bezier(0.3,0,0.1,1) 0.5s both",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute block"
          style={{
            left: "34%",
            top: "10%",
            width: 34,
            height: "48vh",
            background: TEAL,
            opacity: 0.06,
            transform: "rotate(-15deg)",
            animation: "intro-draw 3.2s cubic-bezier(0.3,0,0.1,1) 1.2s both",
          }}
        />

        {/* Layer 1: real method-illustration artifacts, always faded/blurred background texture. */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          {ARTIFACT_PANELS.map((panel) => (
            <ArtifactPanel key={panel.key} panel={panel} />
          ))}
        </div>

        {/* Layer 2: the 3x4 grid of phrases, the Farplas mark, and the three mini-diagrams — spatially non-overlapping by construction. */}
        <div
          className="absolute inset-0 grid"
          style={{
            zIndex: 2,
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gridTemplateRows: "repeat(4, minmax(0, 1fr))",
            gap: 28,
            padding: "52px 64px 74px",
          }}
        >
          {GRID_CELLS.map((cell) => (
            <GridCell key={cell.key} cell={cell} />
          ))}
        </div>

        {/* Layer 3: the climax reveal — the two bars forming the hero's own 八 mark, then the wordmark and slogan. */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-6"
          style={{ zIndex: 3 }}
        >
          <div className="relative" style={{ width: 240, height: 190 }}>
            <span
              className="absolute block"
              style={{
                left: 34,
                top: 0,
                width: 26,
                height: 186,
                background: TEAL,
                transform: "rotate(16deg)",
                animation: "intro-draw 1.1s cubic-bezier(0.3,0,0.1,1) 16.9s both",
              }}
            />
            <span
              className="absolute block"
              style={{
                right: 34,
                top: 0,
                width: 26,
                height: 186,
                background: TEAL,
                transform: "rotate(-16deg)",
                animation: "intro-draw 1.1s cubic-bezier(0.3,0,0.1,1) 17.2s both",
              }}
            />
          </div>
          <div
            className="font-fp-display text-[44px] font-bold tracking-tight uppercase"
            style={{ color: WHITE, animation: "intro-reveal 1.0s cubic-bezier(0.2,0,0.1,1) 18.0s both" }}
          >
            {t("app.title")}
          </div>
          <div
            className="font-fp-slogan text-2xl font-bold tracking-wide"
            style={{ color: TEAL, animation: "intro-reveal 1.0s cubic-bezier(0.2,0,0.1,1) 18.4s both" }}
          >
            {t("launch.slogan")}
          </div>
        </div>

        {/* Layer 4: the white flash transitioning into the real homepage underneath. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 4, background: WHITE, animation: "intro-flood 1.2s cubic-bezier(0.5,0,0.2,1) 18.7s both" }}
        />
      </div>

      <button
        ref={skipButtonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onFinish();
        }}
        className="absolute right-7 bottom-6 rounded-control font-mono text-2xs font-semibold tracking-[0.1em] normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fp-teal focus-visible:ring-offset-2"
        style={{ color: MUTED_TEXT, background: "transparent", zIndex: 5 }}
      >
        {t("launch.intro.skip")}
      </button>
    </div>
  );
}
