import { Stage } from './types';

export const STAGES: Stage[] = [
  {
    id: 'battlefield',
    name: 'Battlefield (戦場)',
    bgGradient: 'linear-gradient(to bottom, #111827, #1f2937, #111827)', // Slate/Noir look
    mainPlatform: {
      x: 150,
      y: 450,
      w: 700,
      h: 40,
      isPassable: false,
    },
    platforms: [
      {
        x: 250,
        y: 330,
        w: 180,
        h: 12,
        isPassable: true,
      },
      {
        x: 570,
        y: 330,
        w: 180,
        h: 12,
        isPassable: true,
      },
      {
        x: 410,
        y: 220,
        w: 180,
        h: 12,
        isPassable: true,
      }
    ],
    blastZones: {
      left: -350,
      right: 1350,
      top: -300,
      bottom: 900,
    }
  },
  {
    id: 'final_destination',
    name: 'Final Destination (終点)',
    bgGradient: 'linear-gradient(to bottom, #0f172a, #1e1b4b, #311042)', // Astral look
    mainPlatform: {
      x: 180,
      y: 470,
      w: 640,
      h: 40,
      isPassable: false,
    },
    platforms: [], // strictly flat!
    blastZones: {
      left: -350,
      right: 1350,
      top: -300,
      bottom: 900,
    }
  },
  {
    id: 'space_station',
    name: 'Cosmic Arena (宇宙ステーション)',
    bgGradient: 'linear-gradient(to bottom, #020617, #0f172a, #111827)', // Deep space
    mainPlatform: {
      x: 250,
      y: 440,
      w: 500,
      h: 35,
      isPassable: false,
    },
    platforms: [
      {
        x: 180,
        y: 320,
        w: 160,
        h: 10,
        isPassable: true,
      },
      {
        x: 660,
        y: 320,
        w: 160,
        h: 10,
        isPassable: true,
      },
      {
        x: 350,
        y: 200,
        w: 300,
        h: 10,
        isPassable: true,
      }
    ],
    blastZones: {
      left: -350,
      right: 1350,
      top: -300,
      bottom: 900,
    }
  }
];
