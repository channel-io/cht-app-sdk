export type WamCanvasTheme = "light" | "dark";

const FALLBACK_CANVAS_COLORS: Record<WamCanvasTheme, string> = {
  light: "#FEFFFF",
  dark: "#1C1C1F",
};

const WAM_CANVAS_STATE_KEY = Symbol.for("@channel.io/app-sdk-wam/canvas-state/v1");

interface StylePropertySnapshot {
  value: string;
  priority: string;
}

interface ElementStyleSnapshot {
  element: HTMLElement;
  backgroundColor: StylePropertySnapshot;
  colorScheme: StylePropertySnapshot;
}

interface WamCanvasEntry {
  canvasColor: string;
  priority: number;
  sequence: number;
  theme: WamCanvasTheme;
}

interface WamCanvasState {
  baseline: ElementStyleSnapshot[];
  entries: Map<symbol, WamCanvasEntry>;
  nextSequence: number;
}

type DocumentWithWamCanvasState = Document & Record<symbol, WamCanvasState | undefined>;

function readWamData(key: string): unknown {
  if (typeof window === "undefined") return undefined;

  try {
    return window.ChannelIOWam?.getWamData(key);
  } catch {
    return undefined;
  }
}

export function getWamCanvasTheme(): WamCanvasTheme {
  return readWamData("appearance") === "dark" ? "dark" : "light";
}

export function getWamCanvasColor(theme: WamCanvasTheme): string {
  return FALLBACK_CANVAS_COLORS[theme];
}

function snapshotProperty(style: CSSStyleDeclaration, property: string): StylePropertySnapshot {
  return {
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  };
}

function snapshotElement(element: HTMLElement): ElementStyleSnapshot {
  return {
    element,
    backgroundColor: snapshotProperty(element.style, "background-color"),
    colorScheme: snapshotProperty(element.style, "color-scheme"),
  };
}

function createCanvasState(targetDocument: Document): WamCanvasState {
  const body = targetDocument.querySelector<HTMLElement>("body");
  const elements =
    body === null ? [targetDocument.documentElement] : [targetDocument.documentElement, body];

  return {
    baseline: elements.map(snapshotElement),
    entries: new Map(),
    nextSequence: 0,
  };
}

function selectActiveEntry(entries: Map<symbol, WamCanvasEntry>): WamCanvasEntry | undefined {
  let activeEntry: WamCanvasEntry | undefined;

  for (const entry of entries.values()) {
    if (
      activeEntry === undefined ||
      entry.priority > activeEntry.priority ||
      (entry.priority === activeEntry.priority && entry.sequence > activeEntry.sequence)
    ) {
      activeEntry = entry;
    }
  }

  return activeEntry;
}

function applyEntry(state: WamCanvasState, entry: WamCanvasEntry): void {
  for (const { element } of state.baseline) {
    element.style.setProperty("background-color", entry.canvasColor);
    element.style.setProperty("color-scheme", entry.theme);
  }
}

function restoreProperty(
  style: CSSStyleDeclaration,
  property: string,
  snapshot: StylePropertySnapshot
): void {
  if (snapshot.value === "") {
    style.removeProperty(property);
    return;
  }

  style.setProperty(property, snapshot.value, snapshot.priority);
}

function restoreBaseline(state: WamCanvasState): void {
  for (const snapshot of state.baseline) {
    restoreProperty(snapshot.element.style, "background-color", snapshot.backgroundColor);
    restoreProperty(snapshot.element.style, "color-scheme", snapshot.colorScheme);
  }
}

/**
 * Synchronize the WAM document canvas while preserving other mounted canvas owners.
 * Higher-priority owners win, and the original inline styles are restored when the
 * final owner is removed.
 */
export function synchronizeWamCanvas(
  theme: WamCanvasTheme,
  canvasColor: string,
  priority: number
): (() => void) | undefined {
  if (typeof document === "undefined") return undefined;

  const targetDocument = document as DocumentWithWamCanvasState;
  let state = targetDocument[WAM_CANVAS_STATE_KEY];

  if (state === undefined) {
    state = createCanvasState(targetDocument);
    targetDocument[WAM_CANVAS_STATE_KEY] = state;
  }

  const owner = Symbol("wam-canvas-owner");
  state.entries.set(owner, {
    canvasColor,
    priority,
    sequence: state.nextSequence++,
    theme,
  });

  const activeEntry = selectActiveEntry(state.entries);
  if (activeEntry !== undefined) applyEntry(state, activeEntry);

  return () => {
    const currentState = targetDocument[WAM_CANVAS_STATE_KEY];
    if (!currentState?.entries.delete(owner)) return;

    const nextEntry = selectActiveEntry(currentState.entries);
    if (nextEntry !== undefined) {
      applyEntry(currentState, nextEntry);
      return;
    }

    restoreBaseline(currentState);
    targetDocument[WAM_CANVAS_STATE_KEY] = undefined;
  };
}
