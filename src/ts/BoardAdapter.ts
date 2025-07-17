export class BoardAdapter {
  private static readonly PIECE_MAP: { [key: string]: string } = {
    'br': 'r', 'bn': 'n', 'bb': 'b', 'bq': 'q', 'bk': 'k', 'bp': 'p',
    'wr': 'R', 'wn': 'N', 'wb': 'B', 'wq': 'Q', 'wk': 'K', 'wp': 'P',
    '  ': '1'
  };

  private static readonly REVERSE_PIECE_MAP: { [key: string]: string } = {
    'r': 'br', 'n': 'bn', 'b': 'bb', 'q': 'bq', 'k': 'bk', 'p': 'bp',
    'R': 'wr', 'N': 'wn', 'B': 'wb', 'Q': 'wq', 'K': 'wk', 'P': 'wp'
  };

  public static pieceMapToFen(pieceMap: string[][]): string {
    let fen = '';
    
    for (let row = 0; row < 8; row++) {
      let rowStr = '';
      let emptyCount = 0;
      
      for (let col = 0; col < 8; col++) {
        const piece = pieceMap[row][col];
        
        if (piece === '  ') {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rowStr += emptyCount.toString();
            emptyCount = 0;
          }
          rowStr += this.PIECE_MAP[piece] || '1';
        }
      }
      
      if (emptyCount > 0) {
        rowStr += emptyCount.toString();
      }
      
      fen += rowStr;
      if (row < 7) fen += '/';
    }
    
    return fen;
  }

  public static fenToPieceMap(fen: string): string[][] {
    const rows = fen.split('/');
    const pieceMap: string[][] = [];
    
    for (let i = 0; i < 8; i++) {
      const row: string[] = [];
      const rowData = rows[i];
      
      for (let j = 0; j < rowData.length; j++) {
        const char = rowData[j];
        
        if (char >= '1' && char <= '8') {
          const emptyCount = parseInt(char);
          for (let k = 0; k < emptyCount; k++) {
            row.push('  ');
          }
        } else {
          row.push(this.REVERSE_PIECE_MAP[char] || '  ');
        }
      }
      
      pieceMap.push(row);
    }
    
    return pieceMap;
  }

  public static coordinateToSquare(tileX: number, tileY: number): string {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return files[tileX] + ranks[tileY];
  }

  public static squareToCoordinate(square: string): { tileX: number; tileY: number } {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    const file = square[0];
    const rank = square[1];
    
    return {
      tileX: files.indexOf(file),
      tileY: ranks.indexOf(rank)
    };
  }

  public static buildFullFen(pieceMap: string[][], turn: 'w' | 'b', castleRights: string = 'KQkq', enPassant: string = '-', halfMove: number = 0, fullMove: number = 1): string {
    const boardFen = this.pieceMapToFen(pieceMap);
    return `${boardFen} ${turn} ${castleRights} ${enPassant} ${halfMove} ${fullMove}`;
  }
}