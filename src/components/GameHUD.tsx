import React from 'react';
import { Player, Stage } from '../types';
import { ArrowLeft, RefreshCw, VolumeX, Volume2, Trophy, Clock, XSquare } from 'lucide-react';
import { sfx } from '../audio';

interface GameHUDProps {
  player1: Player;
  player2: Player;
  timeLeft: number;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  onReset: () => void;
  countdown: number | string | null;
  winner: Player | null;
  stage: Stage;
  onRematch: () => void;
}

export default function GameHUD({
  player1,
  player2,
  timeLeft,
  isPaused,
  setIsPaused,
  onReset,
  countdown,
  winner,
  stage,
  onRematch,
}: GameHUDProps) {

  // Convert seconds to MM:SS format
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Convert damage percentage to matching color gradient classes
  const getPercentageColor = (pct: number) => {
    if (pct < 40) return 'text-white border-slate-700 font-medium';
    if (pct < 80) return 'text-yellow-400 font-bold';
    if (pct < 120) return 'text-orange-500 font-extrabold drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]';
    if (pct < 180) return 'text-red-500 font-black animate-pulse drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]';
    return 'text-rose-600 font-black animate-bounce scale-110 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]';
  };

  const getPercentageBg = (pct: number) => {
    if (pct < 40) return 'bg-slate-900/80';
    if (pct < 80) return 'bg-yellow-950/40 border-yellow-500/50';
    if (pct < 120) return 'bg-orange-950/40 border-orange-500/50';
    return 'bg-red-950/50 border-red-500/60';
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between" id="game-hud-root">
      
      {/* TOP HEADER: Timer, Stage Name, Utility Options */}
      <div className="w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        
        {/* Left Side: Exit button */}
        <div className="pointer-events-auto">
          <button
            onClick={() => { sfx.playMenuClick(); onReset(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700/60 shadow-md backdrop-blur-sm transition-all"
            id="hud-exit-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>キャラクター変更</span>
          </button>
        </div>

        {/* Center: Time, Stage Title */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-slate-900/90 border border-slate-800 shadow-lg text-white font-mono text-sm leading-none backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse-slow" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-mono">
            {stage.name}
          </p>
        </div>

        {/* Right Side: Pause & Mute controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              sfx.playMenuHover();
              setIsPaused(!isPaused);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700/60 shadow-md backdrop-blur-sm transition-all"
            id="hud-pause-btn"
          >
            {isPaused ? '再開 (Resume)' : '一時停止 (Pause)'}
          </button>
        </div>
      </div>

      {/* PAUSE SCREEN OVERLAY */}
      {isPaused && !winner && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-center items-center pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl flex flex-col gap-4">
            <h3 className="text-xl font-bold text-white tracking-widest">PAUSE</h3>
            <p className="text-xs text-slate-400">ゲームは中断されています。ボタンからコントロールを再開します。</p>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => { sfx.playMenuClick(); setIsPaused(false); }}
                className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-slate-950 font-bold py-2 rounded-lg"
              >
                バトルに戻る
              </button>
              <button
                onClick={() => { sfx.playMenuClick(); onReset(); }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-lg border border-slate-700"
              >
                キャラクター選択へ戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LARGE COUNTDOWN ANNOUNCER */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-scale-up text-center">
            <h2 className="text-7xl md:text-9xl font-black italic select-none font-sans text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-yellow-600 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">
              {countdown}
            </h2>
            {countdown === 'GO!' && (
              <p className="text-xs font-mono text-slate-300 tracking-wider mt-1.5 uppercase font-bold drop-shadow-md">
                BATTLE HAS BEGUN!
              </p>
            )}
          </div>
        </div>
      )}

      {/* VICTORY OVERLAY SCREEN */}
      {winner !== null && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col justify-center items-center pointer-events-auto z-50">
          <div className="max-w-md w-full mx-4 p-8 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700/60 rounded-3xl shadow-2xl text-center flex flex-col gap-6 relative overflow-hidden">
            
            {/* Ambient burst behind winner */}
            <div
              className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 select-none pointer-events-none"
              style={{ backgroundColor: winner.character.color }}
            />

            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-3 shadow-lg border-2"
                style={{
                  backgroundColor: `${winner.character.color}30`,
                  borderColor: winner.character.color
                }}
              >
                {winner.character.icon}
              </div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">
                {winner.isCpu ? `CPU (LV.${winner.cpuDifficulty.toUpperCase()})` : `PLAYER ${winner.id}`}
              </p>
              <h2 className="text-3xl font-black text-white mt-1 uppercase tracking-tight">
                {winner.character.name} が勝利!
              </h2>
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 py-1 px-3 rounded-full border border-yellow-500/20">
                <Trophy className="w-4 h-4 fill-yellow-400" />
                <span>VICTORY DECREED</span>
              </div>
            </div>

            {/* Performance analysis metrics */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-xs flex flex-col gap-3.5">
              <div className="flex justify-between items-center text-slate-400">
                <span>最終ダメージの蓄積度</span>
                <span className="text-lg font-mono font-bold text-slate-200">
                  {Math.floor(winner.percentage)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/50 pt-2.5">
                <span>残りストック(命)</span>
                <span className="text-lg font-mono font-black text-rose-500 flex gap-1">
                  {Array.from({ length: Math.max(0, winner.stocks) }).map((_, i) => (
                    <span key={`won-stock-ico-${i}`}>{winner.character.icon}</span>
                  ))}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { sfx.playMenuClick(); onRematch(); }}
                className="flex-1 bg-gradient-to-r from-red-500 to-amber-500 text-slate-950 hover:from-red-650 hover:to-amber-550 font-extrabold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                もう一度戦う (Rematch)
              </button>
              <button
                onClick={() => { sfx.playMenuClick(); onReset(); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold py-3 rounded-xl border border-slate-700/60 active:scale-95 transition-all text-sm"
              >
                キャラクター選択へ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM HUD MODULE: DAMAGE & STOCK COUNTERS */}
      <div className="w-full p-6 flex flex-col sm:flex-row justify-between items-end gap-4 bg-gradient-to-t from-black/80 to-transparent">
        
        {/* PLAYER 1 HUD (Left aligned) */}
        <div
          className={`flex-1 max-w-[280px] w-full border rounded-2xl p-3 flex gap-3 shadow-xl backdrop-blur-md transition-all ${
            player1.stocks === 0 ? 'opacity-30 saturation-0' : ''
          } ${getPercentageBg(player1.percentage)}`}
          id="hud-p1"
        >
          {/* Badge icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shrink-0 self-center shadow border-2"
            style={{
              backgroundColor: `${player1.character.color}20`,
              borderColor: player1.character.color
            }}
          >
            {player1.character.icon}
          </div>

          <div className="flex-1 flex flex-col justify-between">
            {/* Meta name and stock */}
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] font-extrabold text-white truncate max-w-[100px] font-sans">
                {player1.name}
              </span>
              {/* Stocks dots or icons */}
              <div className="flex gap-0.5" id="hud-p1-stocks">
                {player1.stocks > 0 ? (
                  Array.from({ length: player1.stocks }).map((_, i) => (
                    <span key={`p1-stock-dot-${i}`} className="text-xs leading-none drop-shadow">
                      ❤️
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] text-red-500 uppercase font-bold tracking-wider font-mono">
                    ☠️ OUT
                  </span>
                )}
              </div>
            </div>

            {/* Huge numerical damage percentage */}
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl md:text-3xl font-black font-sans tracking-tight leading-none ${getPercentageColor(
                  player1.percentage
                )}`}
                id="hud-p1-percentage"
              >
                {Math.floor(player1.percentage)}
              </span>
              <span className="text-xs text-slate-400 font-bold font-mono">%</span>
            </div>

            {/* Shield and invincible indicator bars */}
            <div className="flex flex-col gap-0.5 mt-1">
              {/* Shield health bar */}
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 shadow-sm transition-all"
                  style={{ width: `${player1.shieldHealth}%` }}
                />
              </div>
              {player1.invincibleFrames > 0 && (
                <div className="text-[8px] font-mono text-cyan-400 font-bold uppercase leading-none mt-0.5">
                  🛡️ INVINCIBLE
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PLAYER 2 / CPU HUD (Right aligned) */}
        <div
          className={`flex-1 max-w-[280px] w-full border rounded-2xl p-3 flex gap-3 shadow-xl backdrop-blur-md transition-all sm:self-end ${
            player2.stocks === 0 ? 'opacity-30 saturation-0' : ''
          } ${getPercentageBg(player2.percentage)}`}
          id="hud-p2"
        >
          {/* Badge icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shrink-0 order-first sm:order-last self-center shadow border-2"
            style={{
              backgroundColor: `${player2.character.color}20`,
              borderColor: player2.character.color
            }}
          >
            {player2.character.icon}
          </div>

          <div className="flex-1 flex flex-col justify-between">
            {/* Meta name and stock */}
            <div className="flex justify-between items-baseline">
              <div className="flex gap-0.5 sm:order-last" id="hud-p2-stocks">
                {player2.stocks > 0 ? (
                  Array.from({ length: player2.stocks }).map((_, i) => (
                    <span key={`p2-stock-dot-${i}`} className="text-xs leading-none drop-shadow">
                      ❤️
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] text-red-500 uppercase font-bold tracking-wider font-mono">
                    ☠️ OUT
                  </span>
                )}
              </div>
              <span className="text-[11px] font-extrabold text-white truncate max-w-[100px] font-sans">
                {player2.isCpu ? `CPU (LV.${player2.cpuDifficulty.toUpperCase()})` : player2.name}
              </span>
            </div>

            {/* Huge numerical damage percentage */}
            <div className="flex items-baseline gap-1 sm:justify-start">
              <span
                className={`text-2xl md:text-3xl font-black font-sans tracking-tight leading-none ${getPercentageColor(
                  player2.percentage
                )}`}
                id="hud-p2-percentage"
              >
                {Math.floor(player2.percentage)}
              </span>
              <span className="text-xs text-slate-400 font-bold font-mono">%</span>
            </div>

            {/* Shield and invincible indicator bars */}
            <div className="flex flex-col gap-0.5 mt-1">
              {/* Shield health bar */}
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 shadow-sm transition-all"
                  style={{ width: `${player2.shieldHealth}%` }}
                />
              </div>
              {player2.invincibleFrames > 0 && (
                <div className="text-[8px] font-mono text-cyan-400 font-bold uppercase leading-none mt-0.5">
                  🛡️ INVINCIBLE
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
