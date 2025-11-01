// app/lib/seed.ts

/*
- Generates reproducible pseudo-random sequences from a daily seed (YYYY-MM-DD).
- Use a lightweight PRNG (e.g. mulberry32).
This feeds both:
- createLetterBag(seed)
- worldDropSequence(seed)
*/