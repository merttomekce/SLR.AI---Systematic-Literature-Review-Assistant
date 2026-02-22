# SLR AI - Systematic Literature Review Tool

A modern, minimalist Next.js frontend for AI-powered systematic literature review workflows. Features dark/light theme contrast, smooth animations, and professional data visualization.

## Features

- **Dashboard** - Overview of all systematic literature reviews with progress tracking
- **Setup Configuration** - Create new reviews with detailed research criteria and paper uploads
- **Abstract Screening** - Interactive paper screening with AI-powered decision support
- **Quality Gate** - Review screening results with comprehensive quality metrics and assurance checks
- **Full-Text Review** - Extract and analyze data from included studies with scoring and notes
- **Comparison Analysis** - Compare AI models and screening strategies with interactive charts
- **Dark/Light Theme** - Seamless theme toggle with persistent preferences
- **Responsive Design** - Mobile-first approach with full responsiveness across all devices
- **Smooth Animations** - Polished transitions and micro-interactions throughout

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: v19.2
- **TypeScript**: v5.7
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Theme**: next-themes
- **Forms**: React Hook Form + Zod
- **State Management**: React Hooks + SWR-ready

## Project Structure

```
app/
├── layout.tsx                 # Root layout with theme provider
├── page.tsx                   # Dashboard
├── globals.css                # Design tokens & animations
└── review/
    ├── setup/page.tsx         # Review setup
    ├── screening/page.tsx     # Abstract screening
    ├── gate/page.tsx          # Quality gate
    ├── fulltext/page.tsx      # Full-text review
    └── comparison/page.tsx    # Comparison analysis

components/
├── sidebar.tsx                # Navigation sidebar
├── header.tsx                 # Header with theme toggle
├── layout-wrapper.tsx         # Main layout wrapper
└── ui/                        # shadcn components

lib/
└── utils.ts                   # Utility functions (cn)
```

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) to view in browser.

## Design System

### Colors (Black-White Contrast)

**Light Mode:**
- Background: `oklch(0.98 0 0)` (near white)
- Foreground: `oklch(0.15 0 0)` (near black)
- Primary: `oklch(0.15 0 0)` (black)
- Secondary: `oklch(0.92 0 0)` (light gray)

**Dark Mode:**
- Background: `oklch(0.12 0 0)` (near black)
- Foreground: `oklch(0.95 0 0)` (near white)
- Primary: `oklch(0.98 0 0)` (white)
- Secondary: `oklch(0.25 0 0)` (dark gray)

### Typography

- **Font Family**: Geist (sans), Geist Mono (monospace)
- **Headings**: Bold, 1.2-3xl sizes
- **Body**: Regular weight, 0.875-1rem sizes
- **Line Height**: 1.4-1.6 (leading-relaxed)

### Spacing

Uses Tailwind's default spacing scale (4px increments):
- `p-4` = 1rem padding
- `gap-4` = 1rem gap
- `mt-6` = 1.5rem margin-top

### Animations

**Built-in Classes:**
- `.fade-in` - Fade in animation (500ms)
- `.slide-in-from-top` - Slide from top (500ms)
- `.slide-in-from-bottom` - Slide from bottom (500ms)
- `.scale-in` - Zoom in animation (300ms)
- `.transition-smooth` - Smooth transitions (300ms)
- `.transition-smooth-lg` - Longer transitions (500ms)
- `.button-hover-lift` - Button lift on hover
- `.card-hover` - Card hover effect
- `.soft-pulse` - Gentle pulse animation (3s)

## Features Walkthrough

### Dashboard
- View all systematic literature reviews
- Track progress with visual metrics
- Quick access to start new reviews
- Review status indicators (in-progress, completed, archived)

### Setup Configuration
- Configure review title and description
- Define research question
- Set inclusion/exclusion criteria
- Upload papers (PDF, CSV, TXT)
- Summary sidebar with progress

### Abstract Screening
- Interactive paper-by-paper screening
- Left sidebar with paper list and filters
- AI confidence scores displayed
- Four-tab filter system (All, Included, Excluded, Pending)
- Decision buttons (Include/Exclude)
- Progress tracking with statistics

### Quality Gate
- Overview of screening results
- Four key quality metrics
- Decision summary visualization
- Quality assurance checks (5/5 passed)
- Recommendations and warnings
- Next steps guidance

### Full-Text Review
- Extract data from included studies
- Quality and relevance scoring (0-10)
- Data extraction form
- Notes and observations
- Quality score sliders
- Paper-by-paper navigation

### Comparison Analysis
- Compare multiple AI models
- Accuracy vs processing time scatter plot
- Screening vs extraction accuracy
- Progress over rounds line chart
- Detailed comparison table
- Cost-benefit analysis
- Recommendations panel

## Customization

### Changing Colors

Edit `/app/globals.css` CSS variables:

```css
:root {
  --primary: oklch(0.15 0 0);      /* Black in light mode */
  --background: oklch(0.98 0 0);   /* White in light mode */
  /* ... */
}

.dark {
  --primary: oklch(0.98 0 0);      /* White in dark mode */
  --background: oklch(0.12 0 0);   /* Black in dark mode */
  /* ... */
}
```

### Adding New Pages

1. Create new directory under `/app`
2. Create `page.tsx` with React component
3. Wrap with `<LayoutWrapper>` for consistent layout
4. Add navigation item to `components/sidebar.tsx`

### Modifying Animations

Edit utilities section in `/app/globals.css` or use Tailwind animation utilities directly in components:

```tsx
<div className="animate-in fade-in duration-500 delay-100">
  Content
</div>
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations

- Image optimization with Next.js Image
- Code splitting and lazy loading
- CSS modules and Tailwind purging
- Server-side rendering (App Router)
- Responsive design for all viewports
- Smooth animations with GPU acceleration

## Development

### Hot Module Replacement
Changes to files are automatically reflected without full page reload.

### TypeScript
Strict mode enabled for type safety across all components.

### ESLint
Run linting:
```bash
pnpm lint
```

## Deployment

### Vercel
Optimized for Vercel deployment:

```bash
# Deploy to Vercel
pnpm build
git push
```

### Other Platforms
Works with any Node.js hosting:
```bash
pnpm build
pnpm start
```

## Future Enhancements

- Backend API integration for data persistence
- User authentication and account management
- Real AI model integration
- PDF text extraction
- Collaborative features
- Export to various formats (PDF, Excel, Word)
- Advanced filtering and search
- Machine learning model training interface
- Real-time collaboration
- Audit logging

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
