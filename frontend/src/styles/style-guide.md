# Frontend Style Guide & Design System

Welcome to the LegalAI Frontend Style Guide! **All team members are obligated to follow these guidelines** to ensure visual consistency, maintain code quality, and seamlessly support Dark Mode and layout responsiveness.

> [!CAUTION]
> Hardcoding hex codes, using arbitrary pixel values (e.g., `w-[15px]`), or utilizing default raw Tailwind properties that do not exist in our Figma specs is strictly forbidden.

---

## 1. Color System (Strict Usage)

We use a semantic color system. Our raw colors (primitives) are converted into **Semantic Tokens**. You must **only use Semantic Tokens** in your Tailwind classes. This ensures that the application will automatically switch between Light and Dark modes without writing manual dark modifiers (e.g., `dark:bg-black`).

### ✅ DO Use Semantic Colors:

**Backgrounds:**

- `bg-background-primary` - **Usage:** The foundational background color for the overall layout. **Example:** The `<body>` element or the primary wrapper of a page.
- `bg-background-secondary` - **Usage:** Elevated component surfaces that sit on top of the primary background. **Example:** Sidebar navigations, floating cards, or dropdown menus.
- `bg-background-tertiary` - **Usage:** Distinct nested surfaces sitting inside secondary components. **Example:** A highlighted search bar input nested inside a header card, or alternating table row backgrounds.

**Text:**

- `text-text-primary` - **Usage:** For the highest-contrast text. **Example:** Main headings (`<h1>`), primary body paragraphs, active navigation links.
- `text-text-secondary` - **Usage:** Text that is supplementary or less critical. **Example:** Captions, datagrid timestamps, component sub-headers, or unselected tabs.
- `text-text-tertiary` - **Usage:** Text that should fade into the background visually until focused on. **Example:** Input placeholders ("Search..."), disabled button text, or highly subtle helper texts.

**Borders & Focus Rings:**

- `border-border-primary` - **Usage:** Strong, visible borders used to separate major sections. **Example:** The outline of a master layout card, or structural `<hr />` dividers.
- `border-border-secondary` - **Usage:** Soft borders for slight visual separation. **Example:** Dividers between list items or internal cell borders inside a data table.
- `border-border-focus` (or `ring-ring`) - **Usage:** Keyboard accessibility and active states. **Example:** The glowing outline around a text input when a user clicks into it.

**Status / Alerts / Brand:**

- `text-error-primary`, `bg-success-secondary`, `border-warning-primary` - **Usage:** Communicating state to the user. **Example:** Displaying `text-error-primary` on a failed password validation label or `bg-success-secondary` on a "File Uploaded" toast notification.
- `bg-primary`, `text-primary-foreground` - **Usage:** Core brand interaction. **Example:** The main "Submit" call-to-action button uses `bg-primary`.

### ❌ DON'T Use Primitive or Arbitrary Colors:

```tsx
// ❌ BAD: Breaks dark mode and doesn't match design tokens
<div className="bg-[#FFFFFF] text-gray-900 border-red-500">

// ✅ GOOD: Always adapts accurately across themes
<div className="bg-background-primary text-text-primary border-border-primary">
```

---

## 2. Typography

We use **Google Sans Flex** universally. DO NOT manually define `fontSize`, `lineHeight`, or `fontWeight` attributes. Instead, rely solely on our predefined Tailwind text presets.

### ✅ DO Use Predefined Typography:

**Headings:**

- `text-h1` to `text-h5`
  - **Usage:** Structured page hierarchy.
  - **Example:** Use `text-h1` for the single Main Page Title (48px). Use `text-h3` for Dashboard Widget titles (32px).

**Body Text:**

- `text-large` (18px) - **Usage:** Introduction text or callouts. **Example:** The descriptive subtitle under a hero banner.
- `text-p` (16px) - **Usage:** The standard reading text. **Example:** Paragraphs in a blog post or legal document view.
- `text-p-medium` (16px, font-weight 500) - **Usage:** Text requiring subtle emphasis without being a heading. **Example:** Bolded field labels or user names in a comment thread.
- `text-small` (16px scale adjusted) - **Usage:** Condensed information. **Example:** Text inside standard UI components, badges, or footnotes.

**Buttons:**

- `text-btn-giant`, `text-btn-large`, `text-btn-medium`, `text-btn-small`, `text-btn-tiny`.
  _Always use these on buttons instead of raw sizes like `text-sm`._

### ❌ DON'T Use Arbitrary Sizes:

```tsx
// ❌ BAD: Avoid arbitrary text values and manual weights
<h1 className="text-[40px] font-bold leading-tight">Title</h1>

// ✅ GOOD: Uses design system constraints
<h1 className="text-h2">Title</h1>
```

---

## 3. Spacing & Grid System

Our spacing and grid systems are strictly mapped to scale. **Do not use arbitrary values like `p-[15px]` or standard Tailwind spacing metrics that break our system.**

### Spacing Scale

Our application relies exclusively on the **Tailwind CSS default spacing scale**.
Remember that Tailwind's base unit is `0.25rem` (4px).

Do NOT use subjective, non-existent tailwind multipliers or arbitrary pixel definitions like `p-[15px]` or `gap-[18px]`.

```tsx
// ✅ GOOD: p-4 = 16px, mb-6 = 24px, gap-2 = 8px
<div className="p-4 mb-6 gap-2">
```

### Grid Container

For the layout structure, wrap your main grid layers inside the `container` tailwind class. This class uses our auto-adjusting custom `grid-margin` which scales nicely from mobile `16px` padded edges up to the `1440px` max width screen dimension.

---

## 4. Radii & Elevations (Shadows)

### Shadows

Do not use Tailwind's default `shadow-sm` or `shadow-lg`. Use our mapped shadow steps starting from 100 extending to 800:

- `shadow-100` to `shadow-200` - **Usage:** Very subtle elevation. **Example:** Standard input fields or hovered interactive badges.
- `shadow-300` to `shadow-400` - **Usage:** Component elevation. **Example:** Main layout cards, sidebar containers, or standard dropdown menus.
- `shadow-500` to `shadow-800` - **Usage:** High z-index overlays. **Example:** Full screen modal dialogues (`shadow-600`), floating action buttons, or deep popovers overlaying other content.

### Border Radius

Our rounded corners are mapped to Shadcn UI's root `--radius` scaling:

- `rounded-lg` - **Usage:** Major structural containers. **Example:** The main wrapper for a Dashboard Card or Modal window.
- `rounded-md` - **Usage:** Interactive elements. **Example:** Standard textual inputs, textareas, or medium-sized buttons.
- `rounded-sm` - **Usage:** Small sub-components. **Example:** Checkbox indicators or tiny status badges.
- `rounded-xl` - **Usage:** Softly styling extremely large prominent containers. **Example:** A hero-section banner image.

> [!NOTE]
> Do not use `rounded-[10px]`. Rely entirely on standard `rounded-*` scale.

---

## Summary of Obligation

1. Look in `tailwind.config.js` or `theme.css` before writing subjective CSS classes.
2. If the mockups ask for specific pixels for gaps or paddings, use our closest **Spacing unit**.
3. If an element feels "flat", use a verified shadow `shadow-[100...800]`.
4. Keep all components stateless regarding colors (avoid evaluating logic checks for Light/Dark in JS `className` properties).
