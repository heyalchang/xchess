export interface ChessMoveResult {
  san: string | null;
  confidence: number;
  originalText: string;
  error?: string;
}

export interface ParseContext {
  currentFEN: string;
  legalMoves: string[];
  lastMove?: string;
  playerColor: 'white' | 'black';
}

export class MoveParser {
  private homophones: { [key: string]: string } = {
    // Numbers
    'won': '1', 'one': '1',
    'to': '2', 'too': '2', 'two': '2',
    'three': '3', 'tree': '3',
    'for': '4', 'four': '4', 'fore': '4',
    'five': '5', 'fife': '5',
    'six': '6', 'sick': '6',
    'seven': '7',
    'ate': '8', 'eight': '8',
    
    // Files
    'a': 'a', 'ay': 'a',
    'be': 'b', 'bee': 'b',
    'see': 'c', 'sea': 'c',
    'dee': 'd',
    'e': 'e', 'ee': 'e',
    'f': 'f', 'ef': 'f',
    'g': 'g', 'gee': 'g',
    'h': 'h', 'aitch': 'h',
    
    // Pieces
    'night': 'knight', 'nite': 'knight',
    'king': 'king', 'k': 'king',
    'queen': 'queen', 'q': 'queen',
    'rook': 'rook', 'castle': 'rook', 'tower': 'rook',
    'bishop': 'bishop', 'b': 'bishop',
    'pawn': 'pawn', 'p': 'pawn', 'pond': 'pawn',
    
    // Actions
    'takes': 'takes', 'take': 'takes', 'captures': 'takes', 'capture': 'takes',
    'x': 'takes', 'cross': 'takes', 'times': 'takes',
    'check': 'check', 'checkmate': 'checkmate', 'mate': 'checkmate',
    'castles': 'castle',
    'short': 'short', 'king side': 'short', 'kingside': 'short',
    'long': 'long', 'queen side': 'long', 'queenside': 'long',
    
    // Common phrases
    'move': '', 'moves': '', 'go': '', 'goes': '',
    'the': '', 'an': '',
    'piece': '', 'pieces': ''
  };

  private pieceSymbols: { [key: string]: string } = {
    'king': 'K',
    'queen': 'Q', 
    'rook': 'R',
    'bishop': 'B',
    'knight': 'N',
    'pawn': ''
  };

  cleanTranscript(text: string): string {
    // Convert to lowercase and remove punctuation
    let cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    
    // Apply homophone substitutions
    const words = cleaned.split(/\s+/);
    const cleanedWords = words.map(word => {
      return this.homophones[word] || word;
    }).filter(word => word !== '');
    
    return cleanedWords.join(' ');
  }

  parseMove(transcript: string, context?: ParseContext): ChessMoveResult {
    const originalText = transcript;
    const cleaned = this.cleanTranscript(transcript);
    
    console.log(`Parsing: "${originalText}" -> "${cleaned}"`);
    
    // Try different parsing strategies
    const strategies = [
      this.parseStandardMove,
      this.parseCastling,
      this.parseWithContext
    ];
    
    for (const strategy of strategies) {
      const result = strategy.call(this, cleaned, context);
      if (result.san) {
        return result;
      }
    }
    
    return {
      san: null,
      confidence: 0,
      originalText,
      error: 'Could not parse chess move'
    };
  }

  private parseStandardMove(cleaned: string, context?: ParseContext): ChessMoveResult {
    // Pattern: [piece] [from] [to|takes] [destination] [check/checkmate]
    const patterns = [
      // "knight 2 f3", "queen takes e5"
      /^(knight|queen|king|rook|bishop|pawn)?\s*(?:2|takes)\s*([a-h][1-8])(?:\s+(check|checkmate))?$/,
      // "e4", "exd5" (pawn moves)
      /^([a-h])(?:takes\s*)?([a-h][1-8])(?:\s+(check|checkmate))?$/,
      // "nf3", "qxe5" (abbreviated)
      /^([nqkrb])?(?:takes\s*|x\s*)?([a-h][1-8])(?:\s+(check|checkmate))?$/
    ];
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const piece = match[1] ? this.pieceSymbols[match[1]] || match[1].toUpperCase() : '';
        const destination = match[2];
        const check = match[3] === 'check' ? '+' : match[3] === 'checkmate' ? '#' : '';
        
        let san = piece + destination + check;
        
        // Validate against legal moves if context available
        if (context && context.legalMoves.includes(san)) {
          return {
            san,
            confidence: 0.9,
            originalText: cleaned
          };
        }
        
        return {
          san,
          confidence: 0.7,
          originalText: cleaned
        };
      }
    }
    
    return {
      san: null,
      confidence: 0,
      originalText: cleaned
    };
  }

  private parseCastling(cleaned: string, context?: ParseContext): ChessMoveResult {
    if (cleaned.includes('castle')) {
      if (cleaned.includes('short') || cleaned.includes('king side')) {
        return {
          san: 'O-O',
          confidence: 0.95,
          originalText: cleaned
        };
      } else if (cleaned.includes('long') || cleaned.includes('queen side')) {
        return {
          san: 'O-O-O',
          confidence: 0.95,
          originalText: cleaned
        };
      } else {
        // Default to kingside castle
        return {
          san: 'O-O',
          confidence: 0.8,
          originalText: cleaned
        };
      }
    }
    
    return {
      san: null,
      confidence: 0,
      originalText: cleaned
    };
  }

  private parseWithContext(cleaned: string, context?: ParseContext): ChessMoveResult {
    if (!context) {
      return { san: null, confidence: 0, originalText: cleaned };
    }
    
    // Try to match against legal moves with fuzzy matching
    const legalMoves = context.legalMoves;
    
    // Extract potential destination square
    const squareMatch = cleaned.match(/([a-h][1-8])/);
    if (squareMatch) {
      const destination = squareMatch[1];
      
      // Find legal moves to that square
      const candidateMoves = legalMoves.filter(move => 
        move.includes(destination) && !move.includes('O')
      );
      
      if (candidateMoves.length === 1) {
        return {
          san: candidateMoves[0],
          confidence: 0.8,
          originalText: cleaned
        };
      }
      
      // If multiple candidates, try to disambiguate by piece
      if (candidateMoves.length > 1) {
        for (const piece of ['knight', 'queen', 'king', 'rook', 'bishop']) {
          if (cleaned.includes(piece)) {
            const symbol = this.pieceSymbols[piece];
            const match = candidateMoves.find(move => 
              move.startsWith(symbol) || (symbol === '' && !move.match(/^[NQKRB]/))
            );
            if (match) {
              return {
                san: match,
                confidence: 0.85,
                originalText: cleaned
              };
            }
          }
        }
      }
    }
    
    return {
      san: null,
      confidence: 0,
      originalText: cleaned
    };
  }
}