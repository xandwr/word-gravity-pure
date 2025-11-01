// app/context/GameContext.tsx

/*
- Wraps the app.
- Initializes daily seed (via /api/seed or deterministic PRNG from current date).
- Provides state and dispatch using useReducer.

Reducer actions:
PLACE_TILE, DROP_GRAVITY, EVALUATE_WORDS, CLAIM_WORD, END_TURN, RESET_DAILY.
*/