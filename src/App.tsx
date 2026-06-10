/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import CharacterSelect from './components/CharacterSelect';
import GameHUD from './components/GameHUD';
import GameCanvas from './components/GameCanvas';
import { Player, Stage, Character, GameConfig } from './types';
import { STAGES } from './stages';
import { sfx } from './audio';

export default function App() {
  const [view, setView] = useState<'select' | 'battle'>('select');
  
  // HUD-synchronized mirror states
  const [p1State, setP1State] = useState<Player | null>(null);
  const [p2State, setP2State] = useState<Player | null>(null);
  
  // Configuration cache
  const [stage, setStage] = useState<Stage>(STAGES[0]);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes standard
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);

  // Cache configuration for rematches
  const selectionCacheRef = useRef<{
    p1Char: Character | null;
    p2Char: Character | null;
    isCpu: boolean;
    cpuDifficulty: 'easy' | 'medium' | 'hard';
    config: GameConfig | null;
  }>({
    p1Char: null,
    p2Char: null,
    isCpu: true,
    cpuDifficulty: 'medium',
    config: null,
  });

  // Countdown clock timer logic
  useEffect(() => {
    if (view !== 'battle' || winner !== null) return;

    let timer: NodeJS.Timeout;
    if (countdown !== null) {
      timer = setTimeout(() => {
        if (countdown === 3) setCountdown(2);
        else if (countdown === 2) setCountdown(1);
        else if (countdown === 1) {
          setCountdown('GO!');
          sfx.playMenuClick(); // play sharp start gong
        } else {
          setCountdown(null);
        }
      }, 1000);
    } else if (!isPaused) {
      timer = setTimeout(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Out of time! Determine winner by stock count or percentage
            declareTimeOverWinner();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [view, countdown, isPaused, winner]);

  const declareTimeOverWinner = () => {
    if (!p1State || !p2State) return;
    
    // 1. Compare stocks (more stock -> winner)
    if (p1State.stocks > p2State.stocks) {
      setWinner(p1State);
    } else if (p2State.stocks > p1State.stocks) {
      setWinner(p2State);
    } else {
      // 2. Compare damage percentage (lower percentage -> winner)
      if (p1State.percentage < p2State.percentage) {
        setWinner(p1State);
      } else {
        setWinner(p2State);
      }
    }
    sfx.playRingOut();
  };

  const handleStartGame = (
    p1Char: Character,
    p2Char: Character,
    isPlayer2Cpu: boolean,
    cpuDifficulty: 'easy' | 'medium' | 'hard',
    config: GameConfig
  ) => {
    // Cache configuration for subsequent rematches
    selectionCacheRef.current = {
      p1Char,
      p2Char,
      isCpu: isPlayer2Cpu,
      cpuDifficulty,
      config,
    };

    const chosenStage = STAGES.find((s) => s.id === config.stageId) || STAGES[0];
    setStage(chosenStage);

    // Initial positioning: spaced out on the main platform
    const mainPlat = chosenStage.mainPlatform;
    const p1StartX = mainPlat.x + 100;
    const p2StartX = mainPlat.x + mainPlat.w - 140;
    const startY = mainPlat.y - 40; // standing on surface

    const p1: Player = {
      id: 1,
      name: 'Player 1',
      character: p1Char,
      isCpu: false,
      cpuDifficulty: 'medium',
      x: p1StartX,
      y: startY,
      vx: 0,
      vy: 0,
      width: 40,
      height: 40,
      percentage: 0,
      stocks: config.stocks,
      doubleJumpsLeft: p1Char.maxDoubleJumps,
      facingLeft: false,
      state: 'idle',
      stateTimer: 0,
      invincibleFrames: 60, // 1 second protection
      hitstunFrames: 0,
      shieldHealth: 100,
      shieldActive: false,
      shieldStunFrames: 0,
      currentAttack: null,
      attackTimer: 0,
      attackCooldowns: {},
      hasUsedUpSpecial: false,
    };

    const p2: Player = {
      id: 2,
      name: isPlayer2Cpu ? 'CPU AI' : 'Player 2',
      character: p2Char,
      isCpu: isPlayer2Cpu,
      cpuDifficulty: cpuDifficulty,
      x: p2StartX,
      y: startY,
      vx: 0,
      vy: 0,
      width: 40,
      height: 40,
      percentage: 0,
      stocks: config.stocks,
      doubleJumpsLeft: p2Char.maxDoubleJumps,
      facingLeft: true,
      state: 'idle',
      stateTimer: 0,
      invincibleFrames: 60,
      hitstunFrames: 0,
      shieldHealth: 100,
      shieldActive: false,
      shieldStunFrames: 0,
      currentAttack: null,
      attackTimer: 0,
      attackCooldowns: {},
      hasUsedUpSpecial: false,
    };

    setP1State(p1);
    setP2State(p2);
    setWinner(null);
    setIsPaused(false);
    setTimeLeft(config.timeLimit);
    setCountdown(3); // Start 3-second countdown
    setView('battle');

    // Play sweet startup sfx
    sfx.playLaunch();
  };

  const handleUpdateHUD = (p1: Player, p2: Player) => {
    setP1State(p1);
    setP2State(p2);
  };

  const handleWin = (matchWinner: Player) => {
    setWinner(matchWinner);
    sfx.playRingOut();
  };

  const handleReset = () => {
    setView('select');
    setP1State(null);
    setP2State(null);
    setWinner(null);
    setIsPaused(false);
  };

  const handleRematch = () => {
    const { p1Char, p2Char, isCpu, cpuDifficulty, config } = selectionCacheRef.current;
    if (p1Char && p2Char && config) {
      handleStartGame(p1Char, p2Char, isCpu, cpuDifficulty, config);
    }
  };

  return (
    <main
      className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-6 px-4 select-none relative overflow-x-hidden font-sans"
      id="app-root-container"
    >
      {view === 'select' && (
        <CharacterSelect onStartGame={handleStartGame} />
      )}

      {view === 'battle' && p1State && p2State && (
        <div 
          className="w-full max-w-5xl aspect-[1000/650] bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden"
          id="battle-arena-stage-parent"
        >
          {/* Game Canvas holds physics engine simulation */}
          <GameCanvas
            player1Init={p1State}
            player2Init={p2State}
            stage={stage}
            isPaused={isPaused}
            isGameOver={winner !== null}
            onUpdateHUD={handleUpdateHUD}
            onWin={handleWin}
            countdown={countdown}
          />

          {/* Overlaid UI Head-Up Display */}
          <GameHUD
            player1={p1State}
            player2={p2State}
            timeLeft={timeLeft}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            onReset={handleReset}
            countdown={countdown}
            winner={winner}
            stage={stage}
            onRematch={handleRematch}
          />
        </div>
      )}
    </main>
  );
}
