# Clash Royale War Monitor System

A full-stack analytics dashboard for tracking Clash Royale clan war performance across seasons. Built to give clan leaders a clear picture of player participation, fame scores, and overall activity — all from raw CSV export data.

---

## What it does

- Parses clan war CSV data exported from the game
- Calculates per-player season stats: total fame, decks used, participation %, and average fame per war
- Classifies each player's performance (Perfect → Inactive) based on fame thresholds
- Automatically detects and optionally excludes the Colosseum war from season calculations
- Exposes a REST API consumed by a React frontend dashboard
- Renders charts, heatmaps, and player breakdowns for each season

---

## Tech Stack

**Backend**
- [Rust](https://www.rust-lang.org/) — core language
- [Axum](https://github.com/tokio-rs/axum) — async HTTP framework
- [Tokio](https://tokio.rs/) — async runtime
- [Serde](https://serde.rs/) — CSV deserialization + JSON serialization
- [csv](https://docs.rs/csv) — CSV parsing

**Frontend**
- [React 19](https://react.dev/) + TypeScript
- [Vite](https://vitejs.dev/) — build tool
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Recharts](https://recharts.org/) — charts and heatmaps
- [Axios](https://axios-http.com/) — API calls

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/seasons` | List all available season IDs |
| GET | `/api/seasons/:season_id` | Season summary with war list |
| GET | `/api/dashboard` | Full dashboard data for a season |
| GET | `/api/heatmap` | Fame heatmap data (players × wars) |
| GET | `/api/players/:player_tag` | Individual player stats |

**Dashboard query params:**
```
/api/dashboard?season=128&exclude_colosseum=true&threshold=75
```

---

## Performance Classification

| Level | Fame Range |
|-------|-----------|
| Perfect | 3600 |
| Excellent | 3000 – 3599 |
| Good | 2700 – 2999 |
| Mid | 2500 – 2699 |
| Below Average | 2000 – 2499 |
| Poor | 1 – 1999 |
| Inactive | 0 |

---

## Running Locally

**Backend**
```bash
cd backend
# Place your CSV file at backend/data/clan-2Q9Q2CU.csv
cargo run
# Server starts at http://localhost:3000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# Dev server starts at http://localhost:5173
```

Both must be running at the same time. The frontend calls the backend API at `localhost:3000`.

---

## Project Structure

```
clan-system/
├── backend/
│   ├── src/
│   │   ├── main.rs          # Server setup, routing
│   │   ├── models.rs        # Data structs + PerformanceLevel
│   │   ├── csv_parser.rs    # CSV loading + deserialization
│   │   ├── analytics.rs     # Stats calculation logic
│   │   └── handlers.rs      # HTTP request handlers
│   └── Cargo.toml
└── frontend/
    └── src/
        ├── App.tsx          # Main app component
        ├── api.ts           # Backend API calls
        └── types.ts         # TypeScript types
```
