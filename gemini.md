# SLR.AI Project Context & Rules

## Tech Stack
- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- State Management: Zustand (`store/useReviewStore.ts`)
- Components: shadcn/ui (customized)

## Design System: "Linear" Aesthetic
We are aiming for a highly polished, premium, and intuitive experience that escapes the "AI Slop" or generic template feel. 

### Core Principles
- **Color Scheme**: Ultra-minimalist dark mode. True blacks (`var(--background)`) or extremely dark grays with high-contrast stark white text.
- **Surfaces & Layers**: Use the `.surface-elevated` utility for cards and elevated components instead of standard borders and backgrounds. Use `.floating-layer` where appropriate. Use glassmorphism (`bg-card/50 backdrop-blur-sm`).
- **Typography**: 
  - Use `.text-xs-caps` for small, tracked-out uppercase labels (e.g., table headers, metadata labels).
  - Use `font-mono tracking-tight` for numerical data or stats to give an engineered feel.
- **Interactions**:
  - Buttons use `.button-hover-lift` or utilities like `active:scale-[0.98]` for a tactile, fast feel.
  - Rely on extremely subtle background glows behind active elements rather than hard shadows.
  - Borders are practically invisible or very subtle (e.g. `border-border/50`).

## Implementation Workflow
1. **Plan and Understand**: Ensure new changes align with the premium, data-dense aesthetic.
2. **Build the Foundation**: Start by checking `globals.css` if new layer utilities are needed.
3. **Assemble Pages**: Maintain clean structures, avoiding deeply nested generic UI if simpler structures suffice.
4. **Data-Density without Clutter**: Hide complex actions until hover, use monospaced fonts for IDs/Numbers, use pill-badges gracefully.

## Code Guidelines
- Write clean, strongly-typed TypeScript.
- Use `lucide-react` for icons.
- Check `store/useReviewStore.ts` before creating local state if the state might need to be shared across pages (e.g., API keys, models, current review runs).
