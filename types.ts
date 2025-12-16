export interface PlayerState {
  balance: number;
  username: string;
  level: number;
  xp: number;
}

export interface Fish {
  id: string;
  x: number;
  y: number;
  type: FishType;
  hp: number;
  maxHp: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  emoji: string;
  value: number; // Coins rewarded
  angle: number;
}

export enum FishType {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  BOSS = 'BOSS'
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  power: number; // Damage
  cost: number; // Cost to fire
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  text?: string; // For floating numbers
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
}

export enum GameMode {
  LOBBY = 'LOBBY',
  FISH = 'FISH',
  SLOTS = 'SLOTS',
  CREATIVE = 'CREATIVE'
}
