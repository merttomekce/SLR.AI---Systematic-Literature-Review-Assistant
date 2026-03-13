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
- **Color Scheme**: Minimalist palette. While true blacks and high-contrast whites are the foundation, use beautiful off-whites, creams, and deep blacks for depth. Subtle, soft pastels are permitted for secondary elements or badges to provide a "softer" professional feel without breaking the engineered aesthetic.
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

## Design Context

### Users
Scientific researchers, medical professionals, and academics conducting systematic literature reviews. They require a tool that feels trustworthy, precise, and scientifically rigorous, allowing them to manage thousands of papers without cognitive overload.

### Brand Personality
**Professional, Unique, Literatural.** 
The interface should feel like an elite research instrument—stark, engineered, and deeply focused on text and data. It moves away from "Silicon Valley startup" tropes and toward "Scientific Institution" prestige.

### Aesthetic Direction
- **Primary Inspiration**: [Impeccable Style](https://impeccable.style) — Typography-first, high contrast, minimalist.
- **Secondary Inspiration**: Linear-style data density and tactile interactions.
- **Color Palette**: Sophisticated mix of deep blacks, off-whites, and soft creams. Accentuated by subtle, muted pastels for a refined, "literatural" feel.
- **Anti-References**: NO "AI Purples," NO playful/neon gradients, NO generic AI slop. 

### Design Principles
1. **Typographic Authority**: Let the text (Geist Sans/Mono) do the heavy lifting. Use scale and tracking (caps) for hierarchy instead of colors or backgrounds.
2. **Refined Contrast**: Balance high-contrast blacks and whites with soft off-whites and creams. Use depth and layers to create a precise but "non-sterile" environment.
3. **Data-Density without Clutter**: Respect the user's intelligence by showing complex data structured clearly, hiding actions until intent (hover).
4. **No-Gradients Policy**: Avoid all decorative gradients to maintain the "Literatural" and professional feel.
