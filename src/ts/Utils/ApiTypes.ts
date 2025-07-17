export interface GameStateAPI {
  fen: string;
  turn: 'white' | 'black';
  moveCount: number;
  inCheck: boolean;
  gameOver: boolean;
  isStalemate: boolean;
  lastMove?: string;
  timestamp: number;
}

export interface MoveRequest {
  from: string;
  to: string;
  promotion?: string;
}

export interface MoveResponse {
  success: boolean;
  move?: {
    san: string;
    fen: string;
    from: string;
    to: string;
  };
  error?: string;
}