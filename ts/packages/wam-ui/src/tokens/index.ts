/**
 * WAM design tokens aligned with Channel.io app surfaces.
 *
 * Use these tokens instead of hardcoded values to keep WAM UIs
 * consistent with Channel.io desk.
 */

/**
 * Typography scales matching bezier-react `typo` prop values.
 * Each entry maps to a font-size / line-height pair used in Channel.io app surfaces.
 */
export const TYPO = {
  /** 11px / 16px — timestamps, badges */
  "11": { fontSize: "11px", lineHeight: "16px" },
  /** 12px / 16px — meta text, captions */
  "12": { fontSize: "12px", lineHeight: "16px" },
  /** 13px / 18px — section labels, descriptions */
  "13": { fontSize: "13px", lineHeight: "18px" },
  /** 14px / 20px — body text, list items */
  "14": { fontSize: "14px", lineHeight: "20px" },
  /** 15px / 22px — emphasized body */
  "15": { fontSize: "15px", lineHeight: "22px" },
  /** 18px / 24px — titles */
  "18": { fontSize: "18px", lineHeight: "24px" },
  /** 24px / 32px — page titles */
  "24": { fontSize: "24px", lineHeight: "32px" },
} as const;

/**
 * Common spacing patterns for Channel.io app surfaces.
 */
export const SPACING = {
  /** Form section vertical padding */
  sectionPadding: "24px",
  /** Gap between form fields within a section */
  fieldGap: 12,
  /** Gap between section title and fields */
  sectionTitleGap: 16,
  /** Form row label-field column gap */
  formRowGap: "12px",
  /** Form row label column width */
  formRowLabelWidth: "150px",
  /** WAM container max width */
  wamMaxWidth: "520px",
  /** WAM container horizontal padding */
  wamPadding: "20px",
} as const;

/**
 * Preset Bezier Button prop combinations for common WAM actions.
 *
 * @example
 * ```tsx
 * <Button {...BUTTON_VARIANTS.primary} text="Save" />
 * ```
 */
export const BUTTON_VARIANTS = {
  /** Primary action — e.g., Save, Connect */
  primary: {
    size: "m" as const,
    styleVariant: "primary" as const,
    colorVariant: "blue" as const,
  },
  /** Secondary action — e.g., Cancel, Back */
  secondary: {
    size: "m" as const,
    styleVariant: "secondary" as const,
    colorVariant: "monochrome-dark" as const,
  },
  /** Destructive action — e.g., Delete, Disconnect */
  destructive: {
    size: "m" as const,
    styleVariant: "secondary" as const,
    colorVariant: "red" as const,
  },
  /** Small tertiary — e.g., section actions */
  tertiary: {
    size: "xs" as const,
    styleVariant: "tertiary" as const,
    colorVariant: "monochrome-light" as const,
  },
} as const;

/**
 * Preset bezier Text prop combinations for common WAM text patterns.
 *
 * @example
 * ```tsx
 * <Text {...TEXT_PRESETS.body}>Content</Text>
 * <Text {...TEXT_PRESETS.caption}>Helper text</Text>
 * ```
 */
export const TEXT_PRESETS = {
  /** Page/section title — 18px bold */
  title: { typo: "18" as const, bold: true },
  /** Section heading — 16px bold */
  heading: { typo: "16" as const, bold: true },
  /** Body text — 14px */
  body: { typo: "14" as const },
  /** Bold body — 14px bold */
  bodyBold: { typo: "14" as const, bold: true },
  /** Description / helper — 13px muted */
  caption: { typo: "13" as const, color: "text-neutral-light" as const },
  /** Meta / timestamp — 12px lighter */
  meta: { typo: "12" as const, color: "text-neutral-lighter" as const },
  /** Form label — 13px bold */
  label: { typo: "13" as const, bold: true },
} as const;
