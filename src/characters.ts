import { Character } from './types';

export const CHARACTERS: Character[] = [
  {
    id: 'red_knight',
    name: 'Red Knight',
    displayName: 'レッドナイト (Sword)',
    color: '#ef4444', // Tailwind red-500
    accentColor: '#fee2e2', // red-100
    weight: 100, // standard weight
    speed: 5.5, // medium speed
    jumpForce: 13, // solid jump
    maxDoubleJumps: 1,
    desc: 'ソードで戦う王道なバランス型ファイター。強力なサイドスラッシュと、高い復帰力を持つ。',
    icon: '⚔️',
    attacks: {
      jab: {
        name: 'スラッシュ (Slash)',
        damage: 4,
        baseKnockback: 4,
        knockbackScale: 0.1,
        angle: 30, // horizontal knockback
        activeFrames: 5,
        cooldownFrames: 10,
        rangeX: 45,
        rangeY: 30,
        offsetY: 0,
      },
      sideTilt: {
        name: 'ヘビースラッシュ (Heavy Slash)',
        damage: 12,
        baseKnockback: 8,
        knockbackScale: 0.15,
        angle: 40, // launched forward-up
        activeFrames: 8,
        cooldownFrames: 24,
        rangeX: 65,
        rangeY: 40,
        offsetY: -5,
      },
      upSpecial: {
        name: 'ヒーローリープ (Hero Leap)',
        damage: 10,
        baseKnockback: 8,
        knockbackScale: 0.12,
        angle: 270, // straight up (in raw canvas angle direction layout, wait - canvas coordinates has y increasing downwards, so straight up is angle = 270)
        activeFrames: 15,
        cooldownFrames: 30,
        rangeX: 35,
        rangeY: 60,
        offsetY: -30,
      },
      neutralSpecial: {
        name: 'ファイアシュート (Fire Shot)',
        damage: 7,
        baseKnockback: 3,
        knockbackScale: 0.08,
        angle: 15, // horizontal push
        activeFrames: 6,
        cooldownFrames: 20,
        rangeX: 30,
        rangeY: 30,
        offsetY: 0,
      },
    },
  },
  {
    id: 'blue_mage',
    name: 'Blue Mage',
    displayName: 'ブルーメイジ (Magic Zoner)',
    color: '#3b82f6', // Tailwind blue-500
    accentColor: '#dbeafe', // blue-100
    weight: 80, // lightweight, flies away easily
    speed: 4.8, // slower run speed
    jumpForce: 14.5, // floaty high jump
    maxDoubleJumps: 1,
    desc: '魔法弾を放つ遠距離戦が得意なファイター。急降下テレパシーや広範囲への魔法攻撃が特徴。',
    icon: '🔮',
    attacks: {
      jab: {
        name: 'スパーク (Magic Spark)',
        damage: 3,
        baseKnockback: 3,
        knockbackScale: 0.08,
        angle: 45,
        activeFrames: 4,
        cooldownFrames: 8,
        rangeX: 55,
        rangeY: 35,
        offsetY: 0,
      },
      sideTilt: {
        name: 'ウィンドストリーム (Wind Stream)',
        damage: 9,
        baseKnockback: 7,
        knockbackScale: 0.12,
        angle: 35,
        activeFrames: 10,
        cooldownFrames: 20,
        rangeX: 75,
        rangeY: 30,
        offsetY: 0,
      },
      upSpecial: {
        name: 'ワープフロート (Astral Rise)',
        damage: 6,
        baseKnockback: 5,
        knockbackScale: 0.08,
        angle: 260,
        activeFrames: 12,
        cooldownFrames: 35,
        rangeX: 40,
        rangeY: 80,
        offsetY: -40,
      },
      neutralSpecial: {
        name: 'マナドレイン (Mana Orb)',
        damage: 8,
        baseKnockback: 4,
        knockbackScale: 0.1,
        angle: 20,
        activeFrames: 5,
        cooldownFrames: 18,
        rangeX: 30,
        rangeY: 30,
        offsetY: 0,
      },
    },
  },
  {
    id: 'green_beast',
    name: 'Green Beast',
    displayName: 'グリーンビースト (Heavy)',
    color: '#22c55e', // Tailwind green-500
    accentColor: '#dcfce7', // green-100
    weight: 140, // very heavy! hard to kill
    speed: 4.2, // slow runners
    jumpForce: 11, // heavy jump
    maxDoubleJumps: 1,
    desc: '重量級のパワー型。一撃が非常に重く、自身はふっ飛ばされにくい。圧倒的な力でねじ伏せる。',
    icon: '🦖',
    attacks: {
      jab: {
        name: 'ビーストパンチ (Punch)',
        damage: 6,
        baseKnockback: 6,
        knockbackScale: 0.1,
        angle: 40,
        activeFrames: 6,
        cooldownFrames: 12,
        rangeX: 40,
        rangeY: 35,
        offsetY: 5,
      },
      sideTilt: {
        name: 'メガマグニチュード (Ground Slam)',
        damage: 16,
        baseKnockback: 10,
        knockbackScale: 0.18,
        angle: 50, // launch high!
        activeFrames: 12,
        cooldownFrames: 32,
        rangeX: 70,
        rangeY: 45,
        offsetY: 15,
      },
      upSpecial: {
        name: 'メガリープ (Beast Bounce)',
        damage: 12,
        baseKnockback: 8,
        knockbackScale: 0.12,
        angle: 280,
        activeFrames: 15,
        cooldownFrames: 28,
        rangeX: 45,
        rangeY: 55,
        offsetY: -20,
      },
      neutralSpecial: {
        name: 'ビーストロアー (Beast Roar)',
        damage: 10,
        baseKnockback: 6,
        knockbackScale: 0.11,
        angle: 10, // horizontal blow away
        activeFrames: 6,
        cooldownFrames: 22,
        rangeX: 55,
        rangeY: 55,
        offsetY: 0,
      },
    },
  },
  {
    id: 'purple_ninja',
    name: 'Purple Ninja',
    displayName: 'パープルニンジャ (Speed)',
    color: '#a855f7', // Tailwind purple-500
    accentColor: '#f3e8ff', // purple-100
    weight: 85, // light-medium weight
    speed: 7.0, // extremely fast!
    jumpForce: 14.0, // nimble jump
    maxDoubleJumps: 2, // Ninjas have 2 double jumps (total 3 jumps)!
    desc: '機動力抜群のスピードファイター。トリプルジャンプ（空中2段ジャンプ）が可能で、ステージ外を自在に飛び回る。',
    icon: '🥷',
    attacks: {
      jab: {
        name: 'クナイサクリファイス (Slash)',
        damage: 3,
        baseKnockback: 3,
        knockbackScale: 0.08,
        angle: 20,
        activeFrames: 4,
        cooldownFrames: 7,
        rangeX: 45,
        rangeY: 25,
        offsetY: 0,
      },
      sideTilt: {
        name: 'シャドウスラッシュ (Shadow Dash)',
        damage: 8,
        baseKnockback: 7,
        knockbackScale: 0.11,
        angle: 35,
        activeFrames: 6,
        cooldownFrames: 16,
        rangeX: 60,
        rangeY: 30,
        offsetY: 0,
      },
      upSpecial: {
        name: 'ウミガメジャンプ (Sky Drop)',
        damage: 7,
        baseKnockback: 6,
        knockbackScale: 0.1,
        angle: 270,
        activeFrames: 10,
        cooldownFrames: 24,
        rangeX: 35,
        rangeY: 65,
        offsetY: -25,
      },
      neutralSpecial: {
        name: 'クナイシュート (Star Throw)',
        damage: 5,
        baseKnockback: 3,
        knockbackScale: 0.08,
        angle: 15,
        activeFrames: 4,
        cooldownFrames: 14,
        rangeX: 30,
        rangeY: 30,
        offsetY: 0,
      },
    },
  },
];
