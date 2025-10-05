# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an autonomous response platform (자율주행 선발대 관제 플랫폼) - a web-based disaster management control center that integrates real-time data from autonomous response units (motherships, drones, robots) and uses AI to provide actionable intelligence to 119 emergency dispatch centers and rescue teams.

**Tech Stack**: Next.js 15 (React 19, App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL + PostGIS + Realtime), Kakao Map API, Claude Sonnet API

## Development Commands

### Build & Run
```bash
npm install              # Install dependencies
npm run dev             # Start development server (http://localhost:3000)
npm run build           # Production build
npm start               # Start production server
npm run lint            # Run ESLint
```

### Database Setup
Execute these SQL files in Supabase SQL Editor in order:
1. `lib/supabase/schema.sql` - Creates tables with PostGIS extension
2. `lib/supabase/functions.sql` - Creates `find_nearest_base()` function

Enable Realtime in Supabase Dashboard > Database > Replication for: `disasters`, `response_units`, `sensor_data`, `hazard_overlays`, `ai_briefings`

## Architecture

### Data Flow
1. **Disaster Reporting** (`app/api/disasters/route.ts`):
   - User submits natural language report → Claude API analyzes/structures data → Kakao Geocoding API converts address to coordinates → Saves to Supabase with PostGIS POINT geometry

2. **Automatic Dispatch** (`app/api/dispatch/route.ts`):
   - Uses PostGIS `find_nearest_base()` RPC to find closest fire station → Creates mothership, drone, and robot units → Stores route data

3. **Real-time Updates**:
   - Supabase Realtime subscriptions push database changes to all connected clients
   - Map components react to disasters, response_units, and hazard_overlays updates

### Key Components
- **ControlMap** (`components/ControlMap.tsx`): Main map component with Kakao Maps SDK integration and real-time updates
- **DisasterReportForm** (`components/DisasterReportForm.tsx`): Sends report text to `/api/disasters` endpoint
- **Main Dashboard** (`app/page.tsx`): Orchestrates disaster submission → automatic dispatch flow
- **SimpleMap** (`components/SimpleMap.tsx`): Fallback placeholder (not currently used)

### Database Schema (PostGIS-enabled)
- **disasters**: Stores incident reports with `GEOGRAPHY(POINT)` location field
- **response_bases**: Fire station locations (pre-populated with 5 Seoul stations)
- **response_units**: Tracks mothership/drone/robot positions and routes (JSONB)
- **sensor_data**: Stores thermal/LiDAR/gas sensor readings from units
- **hazard_overlays**: Danger zones (fire, collapse risk, gas leaks) with `GEOGRAPHY(POLYGON)` areas

### Supabase Integration
- Client initialization: `lib/supabase/client.ts` (uses anon key with RLS policies)
- RLS policies allow public read access, authenticated write (prototype-friendly)
- PostGIS functions use `ST_Distance()` for nearest-neighbor queries with spherical earth calculations

### API Routes
- **POST /api/disasters**: Claude AI analysis + geocoding + database insert
- **GET /api/disasters**: Fetch active disasters
- **POST /api/dispatch**: Find nearest base + create response units
- **POST /api/hazards**: Create hazard overlay markers

## Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=         # From Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # From Supabase Dashboard > Settings > API
NEXT_PUBLIC_KAKAO_APP_KEY=        # From Kakao Developers console (JavaScript key for map SDK)
KAKAO_REST_API_KEY=               # From Kakao Developers console (REST API key for geocoding - often same as JavaScript key)
ANTHROPIC_API_KEY=                # From Anthropic Console (server-side only)
```

**Note**: `KAKAO_REST_API_KEY` is required for server-side geocoding in `/api/disasters`. If not set, it will fallback to `NEXT_PUBLIC_KAKAO_APP_KEY`.

## Important Notes

- **Path Aliases**: Uses `@/*` for imports (defined in `tsconfig.json`)
- **Map Implementation**: Uses ControlMap with Kakao Maps SDK for real-time visualization
- **Geocoding**: `lib/kakao/geocoding.ts` provides `geocodeAddress()` and `calculateRoute()` utilities using Kakao REST API
- **Claude Model**: Uses `claude-sonnet-4-20250514` for disaster report analysis
- **PostGIS Required**: Database must have PostGIS extension enabled before running schema.sql
- **Korean Language**: UI and disaster reports are primarily in Korean
- **Kakao API Keys**: Requires both JavaScript key (client-side map) and REST API key (server-side geocoding)
