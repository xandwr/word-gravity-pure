"use client";

/**
 * Home/Landing Page
 * Entry point for the game - displays title and play button
 */

import Link from "next/link";
import { getDailySeed } from "./lib/seed";

export default function Home() {
  const todaySeed = getDailySeed();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        {/* Title */}
        <h1 className="text-7xl font-bold text-white mb-4 tracking-tight">
          Word <span className="text-blue-400">Gravity</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-slate-300 mb-8">
          A daily word puzzle where letters fall and words form
        </p>

        {/* Daily Puzzle Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
          <div className="text-sm text-slate-400 uppercase mb-1">
            Today&apos;s Puzzle
          </div>
          <div className="text-2xl font-mono text-white">{todaySeed}</div>
        </div>

        {/* Play Button */}
        <Link href="/play">
          <button
            className="
              px-12 py-4
              bg-blue-500 hover:bg-blue-600
              text-white text-2xl font-bold
              rounded-xl
              shadow-2xl
              transform hover:scale-105
              transition-all
              duration-200
            "
          >
            Play Today
          </button>
        </Link>

        {/* How to Play */}
        <div className="mt-12 text-left bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">How to Play</h2>
          <ul className="text-slate-300 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">1.</span>
              <span>Select a tile from your hand</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">2.</span>
              <span>Click an empty cell on the board to place it</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">3.</span>
              <span>Watch as gravity pulls tiles downward</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">4.</span>
              <span>Form words and score points!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
