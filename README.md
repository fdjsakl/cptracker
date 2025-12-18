# CPTracker

A modern dashboard for tracking competitive programming progress. Record solved problems, visualize your activity with heatmaps, and organize solutions with Markdown and LaTeX support.

## Features

- **Problem Tracking** - Log problems with URL, difficulty rating, solution notes, and tags
- **Activity Heatmaps** - Visualize daily problem count and max difficulty over time
- **Data Table** - Filter, sort, and search through your problem history
- **Rich Text Solutions** - Write solutions with Markdown, LaTeX math, and syntax-highlighted code
- **CSV Import/Export** - Backup and restore your data easily
- **Offline Storage** - All data stored locally using IndexedDB

## Tech Stack

- React 19 + TypeScript
- Vite
- TailwindCSS 4
- TanStack Table
- Dexie (IndexedDB)
- shadcn/ui components

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Data Schema

| Field | Description |
|-------|-------------|
| 题目 | Problem URL |
| 难度 | Difficulty rating (Codeforces-style) |
| 题解 | Solution notes (supports Markdown/LaTeX) |
| 关键词 | Tags/keywords |
| 日期 | Date solved |

## License

AGPL-3.0
