/**
 * Types and interfaces for the Smash Fighting Game.
 */

export interface Vector2D {
  x: number;
  y: number;
}

export type PlayerState = 
  | 'idle'
  | 'running'
  | 'jumping'
  | 'falling'
  | 'attacking'
  | 'hitstun'
  | 'shielding'
  | 'dead'
  | 'recovering';

export interface AttackDefinition {
  name: string;
  damage: number;
  baseKnockback: number;
  knockbackScale: number; // scales with percentage
  angle: number; // angle in degrees (0 is straight right, 180 is left, 270 is up, 90 is down, in canvas coordinates)
  activeFrames: number;
  cooldownFrames: number;
  rangeX: number;
  rangeY: number;
  offsetY: number; // offset relative to character center
}

export interface Character {
  id: string;
  name: string;
  displayName: string;
  color: string; // main color code
  accentColor: string; // secondary styling color
  weight: number; // higher weight = lower knockback
  speed: number; // horizontal run speed
  jumpForce: number; // original jump power
  maxDoubleJumps: number;
  desc: string;
  icon: string;
  avatarUrl?: string; // fallback stylized visuals
  attacks: {
    jab: AttackDefinition;       // neutral attack
    sideTilt: AttackDefinition;  // directional attack
    upSpecial: AttackDefinition; // recovery (and upward strike)
    neutralSpecial: AttackDefinition; // projectile or range move
  };
}

export interface Player {
  id: 1 | 2;
  name: string;
  character: Character;
  isCpu: boolean;
  cpuDifficulty: 'easy' | 'medium' | 'hard';
  
  // Physics states
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  
  // Game metrics
  percentage: number;
  stocks: number;
  doubleJumpsLeft: number;
  facingLeft: boolean;
  
  // Action status
  state: PlayerState;
  stateTimer: number; // frames spent in current state
  invincibleFrames: number;
  hitstunFrames: number;
  shieldHealth: number; // ranges from 0 to 100
  shieldActive: boolean;
  shieldStunFrames: number;
  
  // Attacks
  currentAttack: AttackDefinition | null;
  attackTimer: number;
  attackCooldowns: Record<string, number>;
  
  // Recovery
  hasUsedUpSpecial: boolean;
}

export interface Projectile {
  id: string;
  ownerId: 1 | 2;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  damage: number;
  baseKnockback: number;
  knockbackScale: number;
  angle: number;
  color: string;
  life: number; // frames until disappear
  maxLife: number;
}

export interface Platform {
  x: number; // left x coord
  y: number; // top y coord
  w: number; // width
  h: number; // height
  isPassable: boolean; // if players can jump through it from below and fall through it with 'down'
}

export interface Stage {
  id: string;
  name: string;
  bgGradient: string; // CSS bg gradient definition
  mainPlatform: Platform;
  platforms: Platform[];
  blastZones: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'smoke' | 'spark' | 'blast' | 'trail' | 'ring';
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  attack: boolean;
  special: boolean;
  shield: boolean;
}

export interface GameConfig {
  stocks: number;
  timeLimit: number; // seconds, 0 = infinite
  stageId: string;
}
