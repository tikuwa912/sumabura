import React, { useState } from 'react';
import { CHARACTERS } from '../characters';
import { STAGES } from '../stages';
import { Character, GameConfig } from '../types';
import { sfx } from '../audio';
import { Play, User, Monitor, Eye, VolumeX, Volume2, ShieldAlert, Award } from 'lucide-react';

const CHARACTER_TRAITS: Record<string, {
  archetype: string;
  perk: string;
  power: number;
  speed: number;
  jump: number;
  defense: number;
  colorClass: string;
}> = {
  red_knight: {
    archetype: '王道バランス ⚔️',
    perk: '王道バランス剣士。高いふっとばし力のヘビースラッシュと優れた機動力を両立させた、誰でも使いこなせる万能型。',
    power: 3.5,
    speed: 3.5,
    jump: 3.5,
    defense: 3.5,
    colorClass: 'bg-red-500',
  },
  blue_mage: {
    archetype: '浮遊・魔道 🔮',
    perk: '空中戦＆遠距離特化。極めて高い滞空力を持ち一瞬浮かび上がる。うねる魔法弾(Mana Orb)は高ダメージ＆高弾道で敵を足止めする。',
    power: 3,
    speed: 2.5,
    jump: 5,
    defense: 2,
    colorClass: 'bg-blue-500',
  },
  green_beast: {
    archetype: '超重量級パワー 🦖',
    perk: '圧倒的タフ。最も吹っ飛ばされにくい。さらに通常/横スマッシュ攻撃中、敵の軽い攻撃を仰け反らずに耐える「スーパーアーマー」が自動発動！',
    power: 5,
    speed: 2,
    jump: 2,
    defense: 5,
    colorClass: 'bg-green-500',
  },
  purple_ninja: {
    archetype: '超高速スカイスター 🥷',
    perk: '空中3段ジャンプ可能！圧倒的な地上＆空中スピードを極めた忍者。非常にスピーディーに手数を叩き込み、復帰力も抜群。',
    power: 2.5,
    speed: 5,
    jump: 4.5,
    defense: 2.5,
    colorClass: 'bg-purple-500',
  },
};

const renderStatBar = (label: string, score: number, colorClass: string) => {
  const fullBlocks = Math.floor(score);
  const partBlock = score % 1 >= 0.5 ? 1 : 0;
  const total = 5;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 tracking-tight">
        <span>{label}</span>
        <span className="text-white font-extrabold">{score * 20}</span>
      </div>
      <div className="flex gap-1 justify-between">
        {Array.from({ length: total }).map((_, i) => {
          let fillPct = 0;
          if (i < fullBlocks) {
            fillPct = 100;
          } else if (i === fullBlocks && partBlock) {
            fillPct = 50;
          }
          return (
            <div key={i} className="h-1.5 flex-1 bg-slate-950 border border-slate-800 rounded-sm overflow-hidden" id={`statbar-dot-${i}`}>
              <div 
                className={`h-full ${colorClass}`} 
                style={{ width: `${fillPct}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface CharacterSelectProps {
  onStartGame: (
    player1Char: Character,
    player2Char: Character,
    isPlayer2Cpu: boolean,
    cpuDifficulty: 'easy' | 'medium' | 'hard',
    config: GameConfig
  ) => void;
}

export default function CharacterSelect({ onStartGame }: CharacterSelectProps) {
  const [p1Index, setP1Index] = useState(0);
  const [p2Index, setP2Index] = useState(1);
  const [isCpu, setIsCpu] = useState(true);
  const [cpuDifficulty, setCpuDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedStageId, setSelectedStageId] = useState('battlefield');
  const [stocks, setStocks] = useState(3);
  const [muted, setMuted] = useState(sfx.getIsMuted());

  const handleP1Select = (index: number) => {
    if (index === p1Index) return;
    setP1Index(index);
    sfx.playMenuHover();
  };

  const handleP2Select = (index: number) => {
    if (index === p2Index) return;
    setP2Index(index);
    sfx.playMenuHover();
  };

  const handleToggleMute = () => {
    const nextMute = sfx.toggleMute();
    setMuted(nextMute);
    if (!nextMute) {
      sfx.playMenuClick();
    }
  };

  const handleConfirm = () => {
    sfx.playMenuClick();
    onStartGame(
      CHARACTERS[p1Index],
      CHARACTERS[p2Index],
      isCpu,
      cpuDifficulty,
      {
        stocks,
        timeLimit: 180, // 3 minutes standard
        stageId: selectedStageId,
      }
    );
  };

  const selectedStage = STAGES.find(s => s.id === selectedStageId) || STAGES[0];

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-6 text-slate-100 flex flex-col gap-6" id="char-select-container">
      {/* Header and Options */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/80 border border-slate-700/50 rounded-2xl p-4 gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚔️</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">SUPER SMASH WEB</h1>
            <p className="text-xs text-slate-400 font-mono">HTML5 PLATFORM FIGHTER ENGINE</p>
          </div>
        </div>
        
        {/* Top bar controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition border border-slate-700 text-slate-300"
            title="Toggle Mute"
            id="btn-toggle-mute"
          >
            {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-green-400" />}
          </button>
        </div>
      </div>

      {/* Grid: Character Selection Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: P1 Character Select (Columns 1-4) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-red-950/20 to-slate-900 border-2 border-red-500/50 rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-red-500/30 text-7xl font-sans font-black select-none pointer-events-none">
            P1
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-red-500 rounded-full" />
            <h2 className="text-xl font-bold text-red-400 font-sans">1P FIGHTER</h2>
          </div>

          {/* Quick grid selection */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {CHARACTERS.map((char, index) => {
              const isSelected = index === p1Index;
              return (
                <button
                  key={`p1-char-${char.id}`}
                  onClick={() => handleP1Select(index)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition relative ${
                    isSelected
                      ? 'bg-red-500/20 border-red-500 shadow-md shadow-red-500/20'
                      : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
                  }`}
                  id={`p1-select-btn-${char.id}`}
                >
                  <span className="text-2xl">{char.icon}</span>
                  <div className="truncate">
                    <div className="text-xs font-mono font-bold leading-tight">{char.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{char.id.replace('_', ' ')}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Character showcase Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col justify-between mt-2">
            <div>
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{CHARACTERS[p1Index].icon}</span>
                  <div>
                    <span className="text-2xl font-black text-white block leading-tight" id="p1-char-title">
                      {CHARACTERS[p1Index].name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 font-sans block mt-0.5">
                      {CHARACTER_TRAITS[CHARACTERS[p1Index].id]?.archetype}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed min-h-[48px] bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/40 mb-3">
                {CHARACTER_TRAITS[CHARACTERS[p1Index].id]?.perk}
              </p>

              {/* Stat meters list */}
              <div className="flex flex-col gap-2.5">
                {renderStatBar("攻撃力 (POWER)", CHARACTER_TRAITS[CHARACTERS[p1Index].id].power, CHARACTER_TRAITS[CHARACTERS[p1Index].id].colorClass)}
                {renderStatBar("移動速度 (SPEED)", CHARACTER_TRAITS[CHARACTERS[p1Index].id].speed, CHARACTER_TRAITS[CHARACTERS[p1Index].id].colorClass)}
                {renderStatBar("復帰・ジャンプ (AIR MOVES)", CHARACTER_TRAITS[CHARACTERS[p1Index].id].jump, CHARACTER_TRAITS[CHARACTERS[p1Index].id].colorClass)}
                {renderStatBar("重さ・防御 (DEFENSE/ARMOR)", CHARACTER_TRAITS[CHARACTERS[p1Index].id].defense, CHARACTER_TRAITS[CHARACTERS[p1Index].id].colorClass)}
              </div>
            </div>

            {/* Special Moves Display */}
            <div className="mt-4 bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-400 flex flex-col gap-1.5 shadow-inner">
              <div className="font-bold text-slate-300 text-[11px] mb-0.5">コマンド技 (COMMANDS):</div>
              <div className="flex justify-between">
                <span>通常攻撃 (F キー)</span>
                <span className="text-slate-200 text-right truncate max-w-[140px] font-medium">{CHARACTERS[p1Index].attacks.jab.name}</span>
              </div>
              <div className="flex justify-between">
                <span>横・ダッシュ攻撃 (D+F / A+F)</span>
                <span className="text-slate-200 text-right truncate max-w-[140px] font-medium">{CHARACTERS[p1Index].attacks.sideTilt.name}</span>
              </div>
              <div className="flex justify-between">
                <span>飛び道具・遠距離 (G キー)</span>
                <span className="text-slate-200 text-right truncate max-w-[140px] font-medium">{CHARACTERS[p1Index].attacks.neutralSpecial.name}</span>
              </div>
              <div className="flex justify-between text-yellow-400 bg-yellow-500/10 px-1 rounded">
                <span>復帰・必殺技 (W+G / S+G)</span>
                <span className="font-bold text-right truncate max-w-[140px]">{CHARACTERS[p1Index].attacks.upSpecial.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Area: Stage and Match configurations (Columns 5-8) */}
        <div className="lg:col-span-4 flex flex-col gap-5 justify-between">
          
          {/* Game Rules / Config Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-extrabold tracking-wider text-slate-300 font-mono uppercase">
              MATCH PARAMETERS
            </h3>

            {/* Matches / stock select */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">ストック数 (LIVES)</label>
              <div className="flex gap-2">
                {[1, 3, 5].map(st => (
                  <button
                    key={`stock-opt-${st}`}
                    onClick={() => { sfx.playMenuHover(); setStocks(st); }}
                    className={`flex-1 py-1 px-3 rounded-lg border font-bold text-sm transition ${
                      stocks === st
                        ? 'bg-white text-slate-950 border-white'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {st} {st === 1 ? 'Life' : 'Lives'}
                  </button>
                ))}
              </div>
            </div>

            {/* Opponent Settings */}
            <div className="border-t border-slate-800 pt-3">
              <label className="block text-xs font-mono text-slate-400 mb-2">対戦モード (GAME MODE)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { sfx.playMenuHover(); setIsCpu(true); }}
                  className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-bold transition ${
                    isCpu
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/60'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  }`}
                  id="btn-mode-cpu"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  VS CPU
                </button>
                <button
                  onClick={() => { sfx.playMenuHover(); setIsCpu(false); }}
                  className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-bold transition ${
                    !isCpu
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  }`}
                  id="btn-mode-local"
                >
                  <User className="w-3.5 h-3.5" />
                  LOCAL 2P
                </button>
              </div>
            </div>

            {/* CPU Difficulty if CPU active */}
            {isCpu && (
              <div className="border-t border-slate-800 pt-3 animate-fade-in">
                <label className="block text-xs font-mono text-slate-400 mb-2">CPUの強さ</label>
                <div className="flex gap-1.5">
                  {(['easy', 'medium', 'hard'] as const).map(diff => (
                    <button
                      key={`diff-opt-${diff}`}
                      onClick={() => { sfx.playMenuHover(); setCpuDifficulty(diff); }}
                      className={`flex-1 py-1 rounded-md text-[11px] font-bold uppercase transition ${
                        cpuDifficulty === diff
                          ? diff === 'easy'
                            ? 'bg-green-500/80 text-white'
                            : diff === 'medium'
                            ? 'bg-yellow-500/80 text-white'
                            : 'bg-red-500/80 text-white'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                      id={`btn-cpu-${diff}`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sizable Stage Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-sm font-extrabold tracking-wider text-slate-300 font-mono uppercase">
              SELECT STAGE
            </h3>
            
            <div className="flex flex-col gap-1.5">
              {STAGES.map(stage => (
                <button
                  key={`stage-opt-${stage.id}`}
                  onClick={() => { sfx.playMenuHover(); setSelectedStageId(stage.id); }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border-2 text-left transition ${
                    selectedStageId === stage.id
                      ? 'bg-slate-800 border-white text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-950/70 hover:border-slate-700'
                  }`}
                  id={`btn-stage-${stage.id}`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{stage.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {stage.platforms.length === 0 ? '平坦なステージ' : `浮遊プラットフォーム ${stage.platforms.length}つ`}
                    </span>
                  </div>
                  <div
                    className="w-10 h-6 rounded border border-slate-600 self-center opacity-75"
                    style={{ background: stage.bgGradient }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Massive Action Start Button */}
          <button
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-slate-950 font-black text-xl py-4 px-6 rounded-2xl shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 transition-all text-center flex items-center justify-center gap-3 border-2 border-white/40 cursor-pointer"
            id="start-battle-button"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            バトル開始!!
          </button>
        </div>

        {/* Right Side: P2/CPU Character Select (Columns 9-12) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-blue-950/20 to-slate-900 border-2 border-blue-500/50 rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-blue-500/30 text-7xl font-sans font-black select-none pointer-events-none">
            {isCpu ? 'CPU' : 'P2'}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-blue-500 rounded-full" />
            <h2 className="text-xl font-bold text-blue-400 font-sans">
              {isCpu ? '対戦相手 (CPU)' : '2P FIGHTER'}
            </h2>
          </div>

          {/* Quick selection grid */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {CHARACTERS.map((char, index) => {
              const isSelected = index === p2Index;
              return (
                <button
                  key={`p2-char-${char.id}`}
                  onClick={() => handleP2Select(index)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition relative ${
                    isSelected
                      ? 'bg-blue-500/20 border-blue-500 shadow-md shadow-blue-500/20'
                      : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
                  }`}
                  id={`p2-select-btn-${char.id}`}
                >
                  <span className="text-2xl">{char.icon}</span>
                  <div className="truncate">
                    <div className="text-xs font-mono font-bold leading-tight">{char.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{char.id.replace('_', ' ')}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Character showcase Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col justify-between mt-2">
            <div>
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{CHARACTERS[p2Index].icon}</span>
                  <div>
                    <span className="text-2xl font-black text-white block leading-tight" id="p2-char-title">
                      {CHARACTERS[p2Index].name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 font-sans block mt-0.5">
                      {CHARACTER_TRAITS[CHARACTERS[p2Index].id]?.archetype}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed min-h-[48px] bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/40 mb-3">
                {CHARACTER_TRAITS[CHARACTERS[p2Index].id]?.perk}
              </p>

              {/* Stat meters list */}
              <div className="flex flex-col gap-2.5">
                {renderStatBar("攻撃力 (POWER)", CHARACTER_TRAITS[CHARACTERS[p2Index].id].power, CHARACTER_TRAITS[CHARACTERS[p2Index].id].colorClass)}
                {renderStatBar("移動速度 (SPEED)", CHARACTER_TRAITS[CHARACTERS[p2Index].id].speed, CHARACTER_TRAITS[CHARACTERS[p2Index].id].colorClass)}
                {renderStatBar("復帰・ジャンプ (AIR MOVES)", CHARACTER_TRAITS[CHARACTERS[p2Index].id].jump, CHARACTER_TRAITS[CHARACTERS[p2Index].id].colorClass)}
                {renderStatBar("重さ・防御 (DEFENSE/ARMOR)", CHARACTER_TRAITS[CHARACTERS[p2Index].id].defense, CHARACTER_TRAITS[CHARACTERS[p2Index].id].colorClass)}
              </div>
            </div>

            {/* Special Moves Display */}
            <div className="mt-4 bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-400 flex flex-col gap-1.5 shadow-inner">
              <div className="font-bold text-slate-300 text-[11px] mb-0.5">コマンド技 (COMMANDS):</div>
              <div className="flex justify-between">
                <span>通常攻撃 (1 or J)</span>
                <span className="text-slate-200 text-right truncate max-w-[140px] font-medium">{CHARACTERS[p2Index].attacks.jab.name}</span>
              </div>
              <div className="flex justify-between">
                <span>横・ダッシュ攻撃 (横+J / J単体)</span>
                <span className="text-slate-200 text-right truncate max-w-[140px] font-medium">{CHARACTERS[p2Index].attacks.sideTilt.name}</span>
              </div>
              <div className="flex justify-between">
                <span>飛び道具・遠距離 (2 or K)</span>
                <span className="text-slate-200 text-right truncate max-w-[140px] font-medium">{CHARACTERS[p2Index].attacks.neutralSpecial.name}</span>
              </div>
              <div className="flex justify-between text-yellow-400 bg-yellow-500/10 px-1 rounded">
                <span>復帰・必殺技 (上+K)</span>
                <span className="font-bold text-right truncate max-w-[140px]">{CHARACTERS[p2Index].attacks.upSpecial.name}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Control instructions panel */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5" id="controls-panel">
        <h3 className="text-sm font-extrabold tracking-wider text-slate-300 font-mono mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          操作方法 (HOW TO CONTROLS)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-400">
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/50">
            <h4 className="text-red-400 font-bold mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Player 1 (左側キーボード操作)
            </h4>
            <div className="grid grid-cols-2 gap-y-2 font-sans">
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">A</span>
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">D</span>
                <span>左右移動</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">W</span>
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">Space</span>
                <span>ジャンプ / 2段可</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">S</span>
                <span>急降下 / すり抜け</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">F</span>
                <span>通常・横アタック</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">G</span>
                <span>特殊技 (ニュートラル/上)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">H</span>
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">Shift</span>
                <span>シールドガード</span>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-500 leading-normal">
              ※ <span className="text-yellow-400 font-bold">W キーを押しながら G ボタン</span> で上方向の復帰スマッシュ攻撃が発動！奈落から這い上がることができます。
            </p>
          </div>

          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/50">
            <h4 className="text-blue-400 font-bold mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Player 2 / CPU (右側キーボード操作)
            </h4>
            <div className="grid grid-cols-2 gap-y-2 font-sans">
              <div className="flex items-center gap-2 animate-pulse-slow">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">←</span>
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">→</span>
                <span>左右移動</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">↑</span>
                <span>ジャンプ / 2段可</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">↓</span>
                <span>急降下 / すり抜け</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">J</span>
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">1</span>
                <span>通常・横アタック</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">K</span>
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">2</span>
                <span>特殊技 (ニュートラル/上)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">L</span>
                <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white font-mono font-bold">3</span>
                <span>シールドガード</span>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-500 leading-normal">
              ※ CPUを選択した場合は、高度な自律戦闘AIが対戦相手となります。距離取り、適切なガード、絶妙な復帰スマッシュを繰り出してきます。
            </p>
          </div>
        </div>
      </div>

      {/* Rules overlay info card */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 flex justify-between gap-4 items-center flex-wrap">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-yellow-400 shrink-0" />
          <span className="text-xs text-slate-300">
            <b>ゲームのルール：</b> ダメージ <b>%</b> が高くなるほど、攻撃を受けた時の
            <b>ふっ飛ばされやすさ（ノックバック）</b> が激増します！ステージ外（画面の上下左右）にふっ飛ばされたらストック（命）を失います。最後まで生き残った方の勝ち！
          </span>
        </div>
      </div>
    </div>
  );
}
