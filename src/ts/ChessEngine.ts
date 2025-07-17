import { Chess, Move } from 'chess.js';

export class ChessEngine {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  public isValidMove(from: string, to: string): boolean {
    const moves = this.chess.moves({ verbose: true });
    return moves.some(move => move.from === from && move.to === to);
  }

  public makeMove(from: string, to: string): Move | null {
    try {
      return this.chess.move({ from, to });
    } catch (error) {
      return null;
    }
  }

  public undoMove(): Move | null {
    return this.chess.undo();
  }

  public isCheck(): boolean {
    return this.chess.inCheck();
  }

  public isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  public isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  public isDraw(): boolean {
    return this.chess.isDraw();
  }

  public isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  public getFen(): string {
    return this.chess.fen();
  }

  public getPgn(): string {
    return this.chess.pgn();
  }

  public getHistory(): string[] {
    return this.chess.history();
  }

  public getTurn(): 'w' | 'b' {
    return this.chess.turn();
  }

  public getPossibleMoves(square?: string): string[] {
    if (square) {
      return this.chess.moves({ square: square as any, verbose: false }) as string[];
    }
    return this.chess.moves({ verbose: false }) as string[];
  }

  public getPossibleMovesVerbose(square?: string): Move[] {
    if (square) {
      return this.chess.moves({ square: square as any, verbose: true });
    }
    return this.chess.moves({ verbose: true });
  }

  public getPiece(square: string): any {
    return this.chess.get(square as any);
  }

  public reset(): void {
    this.chess.reset();
  }

  public loadFen(fen: string): boolean {
    try {
      this.chess.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  public loadPgn(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);
      return true;
    } catch {
      return false;
    }
  }
}