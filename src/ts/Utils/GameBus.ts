export interface Phase1Events {
  'move': { san: string; fen: string; from: string; to: string; };
  'turn': { player: 'white' | 'black' };
  'state': { fen: string; turn: string; moveCount: number; inCheck: boolean; gameOver: boolean; };
}

export class GameBus {
  private static instance: GameBus;
  private listeners: { [key: string]: Array<(data: any) => void> } = {};

  private constructor() {
    this.listeners = {};
  }

  public static getInstance(): GameBus {
    if (!GameBus.instance) {
      GameBus.instance = new GameBus();
    }
    return GameBus.instance;
  }

  public emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  public on(event: string, callback: (data: any) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public off(event: string, callback?: (data: any) => void): void {
    if (this.listeners[event]) {
      if (callback) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      } else {
        this.listeners[event] = [];
      }
    }
  }

  public emitMove(san: string, fen: string, from: string, to: string): void {
    this.emit('move', { san, fen, from, to });
  }

  public emitTurn(player: 'white' | 'black'): void {
    this.emit('turn', { player });
  }

  public emitState(fen: string, turn: string, moveCount: number, inCheck: boolean, gameOver: boolean): void {
    this.emit('state', { fen, turn, moveCount, inCheck, gameOver });
  }

  public onMove(callback: (data: Phase1Events['move']) => void): void {
    this.on('move', callback);
  }

  public onTurn(callback: (data: Phase1Events['turn']) => void): void {
    this.on('turn', callback);
  }

  public onState(callback: (data: Phase1Events['state']) => void): void {
    this.on('state', callback);
  }
}