---
"@channel.io/app-sdk-wam-ui": minor
---

Use redesigned Bezier components from `@channel.io/bezier-react/beta` throughout WAM UI.

Remove the general-purpose `FormSection`, `FormRow`, `InputRow`, `SelectRow`, `ToggleRow`, and
`SearchInput` exports in favor of their Bezier beta equivalents. Update the remaining WAM-specific
components and presets to the Bezier v4 button, banner, icon, form, and toast APIs.

Require `BottomSheet.ariaLabel` and add dialog semantics, focus containment, Escape handling, and
scroll restoration.
