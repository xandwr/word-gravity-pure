# Word Gravity

## Core Concept (v1 Scope)

v1 should fully realize the daily play loop, but without leaderboard backend complexity yet. The goal: a self-contained deterministic daily game playable in browser with cloud scalability in mind.

Features to hit:
- Daily deterministic seed → same bag and world drops for everyone.
- Grid gravity simulation (tiles fall until resting).
- Word detection + claim + scoring sequence.
- End state and result animation (“letter orbit” huzzah).
- Responsive tactile drag-and-drop play on mobile and desktop.

## Entities / Data Structures
Think in terms of three layers: model, state, and UI components.

## React Context / Global State
/context/GameContext.tsx
- Wraps the app.
- Initializes daily seed (via /api/seed or deterministic PRNG from current date).
- Provides state and dispatch using useReducer.

Reducer actions:
- PLACE_TILE, DROP_GRAVITY, EVALUATE_WORDS, CLAIM_WORD, END_TURN, RESET_DAILY.

Each action keeps the state immutable for deterministic replays.

## Determinism
/lib/seed.ts
- Generates reproducible pseudo-random sequences from a daily seed (YYYY-MM-DD).
- Use a lightweight PRNG (e.g. mulberry32).

This feeds both:
- createLetterBag(seed)
- worldDropSequence(seed)

This ensures everyone worldwide plays the same day’s deal.

## Game Logic Modules
Each as a pure functional lib, no React inside.

## Router Structure
/app
 ├─ layout.tsx
 ├─ page.tsx              → Landing page (play button, stats)
/play
 ├─ page.tsx              → Game scene
 └─ end/page.tsx          → Post-game results
/api
 ├─ seed/route.ts         → returns daily seed
 └─ leaderboard/route.ts  → placeholder for future backend

## Backend & Persistence (Future-Proof)

Even if v1 is client-only, design API boundaries now:
- /api/seed — deterministic seed, plus server UTC offset to synchronize days.
- /api/leaderboard — later, POST final score {seed, score, playerHash}.

Deploy backendless via Next’s built-in routes (can scale to Vercel Edge).
Later swap for Supabase/PlanetScale for persistent scores and user IDs.

## Gameplay Loop (v1 Implementation Order)
1. Setup & State
Add GameContext and placeholder board.

2. LetterBag & RNG
Generate seed-based bag, draw player hand.

3. Gravity
Implement grid physics — drop letters in columns.

4. Placement
Drag from hand → slot → trigger gravity → update board.

5. Word Detection
Scan board post-drop for valid words.

6. Claiming
Player click to claim → award points → remove tiles → apply gravity.

7. World Turn
World drops next deterministic tile.

8. End Condition
Empty bag or full board → trigger EndSequence.

9. Animations + Polish
Add tactile transitions, orbit end animation.

10. Daily System
Hook seed to current UTC date.

## Smart Future-Proof Design Choices
- All game logic pure + deterministic → enables replays and cloud verification.
- useReducer for state → explicit state transitions, easy debug/time-travel.
- One-directional data flow (no external mutability) → consistent across devices.
- Component modularity → easy port to React Native for mobile later.
- Serverless APIs → scalable with minimal cost.
- Dictionary + word evaluation client-side → fast offline play.