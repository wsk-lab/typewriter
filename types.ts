export interface PaperCardData {
  id: string;
  text: string;
  x: number;
  y: number;
  rotation: number;
  timestamp: number;
  isTyping: boolean;
}

export enum TypewriterState {
  IDLE = 'IDLE',
  THINKING = 'THINKING', // AI processing
  PRINTING = 'PRINTING', // Animation onto card
}

export interface Coordinates {
  x: number;
  y: number;
}