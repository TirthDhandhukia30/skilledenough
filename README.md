# skilled?

> Analyze GitHub profiles. Discover tech stacks. Uncover opportunities.

## What is this?

**skilled?** analyzes any GitHub profile and tells you:
- What tech stack they're actually good at
- Their experience level (compared to elite developers)
- Career opportunities that match their skills
- What they should learn next

No fluff. Just data.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 |
| Build | Vite 7 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Routing | React Router |
| Icons | Lucide React + Custom SVGs |

---

## Project Structure

```
skilled/
├── public/
│   ├── favicon-skilled.png
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── assets/
│   │   └── images/          # Tech stack SVG icons
│   ├── components/
│   │   └── ui/              # Reusable UI components
│   │       ├── badge.tsx
│   │       ├── card.tsx
│   │       ├── progress.tsx
│   │       ├── separator.tsx
│   │       └── tabs.tsx
│   ├── lib/
│   │   ├── techIcons.tsx    # Icon mappings
│   │   └── utils.ts         # Utility functions
│   ├── pages/
│   │   ├── Home.tsx         # Landing page
│   │   └── Analysis.tsx     # Results & comparison view
│   ├── services/
│   │   ├── analyzer.ts      # Skill analysis engine
│   │   └── githubService.ts # GitHub API client
│   ├── types/
│   │   └── github.ts        # TypeScript interfaces
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/TirthDhandhukia30/skilledenough.git
cd skilledenough

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
npm run preview
```

---

## Fork & Customize

1. **Fork** this repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/skilledenough.git
   ```
3. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/your-feature
   ```
4. **Make changes** and commit:
   ```bash
   git add .
   git commit -m "Add your feature"
   ```
5. **Push** to your fork:
   ```bash
   git push origin feature/your-feature
   ```
6. Open a **Pull Request**

### Environment Variables (Optional)

For higher API rate limits, add a GitHub token:

```bash
# Create .env.local
VITE_GITHUB_TOKEN=your_github_token
```

---

## Features

- 🔍 **Deep Analysis** – Parses repos, languages, commits, PRs
- 📊 **Stack Detection** – Identifies frameworks, tools, and patterns
- ⚡ **Fast** – Parallel API calls with smart caching
- 🌓 **Dark/Light Mode** – System-aware theme toggle
- 🔄 **Compare** – Side-by-side profile comparison
- 📱 **Responsive** – Works on all devices

---

## License

MIT

---

<p align="center">
  <sub>Built with curiosity</sub>
</p>
