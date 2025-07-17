import * as _ from 'lodash';
import * as consts from '../Utils/consts';
import * as utils from '../Utils/utils';
import Pawn from '../Pieces/Pawn';
import Queen from '../Pieces/Queen';
import King from '../Pieces/King';
import Rook from '../Pieces/Rook';
import Bishop from '../Pieces/Bishop';
import Knight from '../Pieces/Knight';
import Piece from '../Pieces/Piece';
import Tile from './Tile';
import { PiecesColors, PiecesType, TilePositionInterface } from '../game.interfaces';
import {
    player, enemy, debugText, gameHistory
} from '../App';
import { ChessEngine } from '../ChessEngine';
import { BoardAdapter } from '../BoardAdapter';
import { GameBus } from '../Utils/GameBus';

export default class Board {
    public pieces: Piece[][] = [[]];
    public tiles: Tile[][] = [[]];
    public currentTile: Tile;
    public previousTile: Tile = null;

    public currentPossibleMoves: Tile[] = [];
    public previousPossibleMoves: Tile[] = null;

    public selectedPiece: Piece = null;
    public chessEngine: ChessEngine;
    private gameBus: GameBus;

    public pieceMap = [
        ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
        ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
        ['  ', '  ', '  ', '  ', '  ', '  ', '  ', '  '],
        ['  ', '  ', '  ', '  ', '  ', '  ', '  ', '  '],
        ['  ', '  ', '  ', '  ', '  ', '  ', '  ', '  '],
        ['  ', '  ', '  ', '  ', '  ', '  ', '  ', '  '],
        ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
        ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
    ];

    constructor() {
        this.chessEngine = new ChessEngine();
        this.gameBus = GameBus.getInstance();
        this.drawBoard();
        this.setupEventListeners();
    }

    public drawBoard(): void {
        for (let i = 0; i < consts.BOARD_SIZE; i++) {
            this.clearBoard(this.tiles[i]);
            this.tiles[i] = [];
            for (let j = 0; j < consts.BOARD_SIZE; j++) {
                const positionY: number = (i * consts.TILE_SIZE) + utils.getHalfScreenHeight();
                const positionX: number = (j * consts.TILE_SIZE) + utils.getHalfScreenWidth();
                const tileName: string = utils.getNameOfTile({ tileX: i, tileY: j });
                this.tiles[i].push(new Tile({ positionX, positionY }, tileName));
            }
        }

        this.drawPieces();
    }

    private drawPieces(): void {
        for (let i = 0; i < this.pieceMap.length; i++) {
            this.clearPieces(this.pieces[i]);
            this.pieces[i] = [];
            for (let j = 0; j < this.pieceMap[i].length; j++) {
                const color = utils.getColorByName(this.pieceMap[i][j]);
                const newPiece = this.newPiece(i, j, color);
                this.pieces[i].push(newPiece);
                if (newPiece && color === PiecesColors.BLACK) enemy.myPieces.push(newPiece);
                else if (newPiece && color === PiecesColors.WHITE) player.myPieces.push(newPiece);
            }
        }

        debugText.setText(this.pieceMap);
    }

    private clearBoard(tiles:Tile[]) {
        if (tiles && tiles.length > 0) {
            for (let j = 0; j < consts.BOARD_SIZE; j++) {
                tiles[j].destroyTile();
                delete this.tiles[j];
            }
        }
    }

    private clearPieces(pieces:Piece[]) {
        let isFirstTime = true;
        if (pieces && pieces.length > 0) {
            for (let j = 0; j < consts.BOARD_SIZE; j++) {
                if (pieces[j]) {
                    isFirstTime = false;
                    pieces[j].destroy();
                    delete this.pieces[j];
                }
            }
        }
        if (!isFirstTime) {
            enemy.resetPieceArray();
            player.resetPieceArray();
        }
    }

    private newPiece(i: number, j: number, color: PiecesColors): Piece {
        const tilePos = { tileX: j, tileY: i };
        const abbr = this.pieceMap[i][j];
        switch (utils.getTypeByName(abbr)) {
            case PiecesType.ROOK:
                return new Rook(tilePos, color);
            case PiecesType.PAWN:
                return new Pawn(tilePos, color);
            case PiecesType.KNIGHT:
                return new Knight(tilePos, color);
            case PiecesType.QUEEN:
                return new Queen(tilePos, color);
            case PiecesType.KING:
                return new King(tilePos, color);
            case PiecesType.BISHOP:
                return new Bishop(tilePos, color);
            default:
                return null;
        }
    }

    public updateMap(previousTile: TilePositionInterface, newPos: TilePositionInterface, piece: Piece) {
        const fromSquare = BoardAdapter.coordinateToSquare(previousTile.tileX, previousTile.tileY);
        const toSquare = BoardAdapter.coordinateToSquare(newPos.tileX, newPos.tileY);
        
        const move = this.chessEngine.makeMove(fromSquare, toSquare);
        if (!move) {
            return;
        }

        const { tileX, tileY } = previousTile;
        this.pieces[tileY][tileX] = null;
        this.pieceMap[tileY][tileX] = '  ';

        const existantPiece = this.getPieceOnTile({ tileY: newPos.tileY, tileX: newPos.tileX });
        if (existantPiece) piece.eat(existantPiece);

        piece = this.checkForConvertingPawn(piece, newPos);
        this.pieces[newPos.tileY][newPos.tileX] = piece;
        this.pieceMap[newPos.tileY][newPos.tileX] = `${player.isMyTurn() ? 'w' : 'b'}${piece.type}`;

        this.syncWithChessEngine();
        debugText.setText(this.pieceMap);
        gameHistory.saveInteraction(this.pieceMap);
        
        // Emit move event through GameBus
        this.gameBus.emitMove(
            move.san,
            this.chessEngine.getFen(),
            fromSquare,
            toSquare
        );
        
        // Emit state change
        this.emitCurrentState();
    }

    public setCurrentTile(current: Tile): Tile {
        if (current && this.currentTile) {
            this.previousTile = this.currentTile;
            this.previousTile.setAsNormal();
        }
        this.currentTile = current;
        this.currentTile.setAsSelected();
        return this.currentTile;
    }

    public getPieceOnTile({ tileX, tileY }: TilePositionInterface): Piece | null {
        if (this.pieces[tileY] && this.pieces[tileX]) {
            return this.pieces[tileY][tileX];
        }
        return null;
    }

    public getTiles(tilePos: TilePositionInterface[] | TilePositionInterface): Tile[] | Tile {
        if (Array.isArray(tilePos)) {
            const tiles: Tile[] = [];
            tilePos.forEach((tile) => {
                const { tileY, tileX } = tile;
                tiles.push(this.tiles[tileY][tileX]);
            });
            return tiles;
        }
        return this.tiles[tilePos.tileY][tilePos.tileX];
    }

    private checkForConvertingPawn(piece: Piece, newPos: TilePositionInterface): Piece {
        const { tileY } = newPos;
        if (piece.type === 'p' && ((player.isMyTurn() && tileY === 0) || (!player.isMyTurn() && tileY === 7))) {
            this.removePiecefromGame(piece.getTile());
            piece.destroy();
            player.removePieceFromArray(piece);
            return new Queen(newPos, player.isMyTurn() ? PiecesColors.WHITE : PiecesColors.BLACK);
        } 
        return piece;
    }

    public isTileFree(tile: Tile): boolean {
        const { tileX, tileY } = tile.tilePosition;
        const tileMapValue = this.pieceMap[tileY][tileX];
        const color = player.isMyTurn() ? PiecesColors.BLACK : PiecesColors.WHITE;
        return (tileMapValue === null || tileMapValue === '  ' || utils.getColorByName(tileMapValue) === color);
    }

    public isValidMove(fromTile: TilePositionInterface, toTile: TilePositionInterface): boolean {
        const fromSquare = BoardAdapter.coordinateToSquare(fromTile.tileX, fromTile.tileY);
        const toSquare = BoardAdapter.coordinateToSquare(toTile.tileX, toTile.tileY);
        return this.chessEngine.isValidMove(fromSquare, toSquare);
    }

    public getPossibleMovesForPiece(tilePos: TilePositionInterface): string[] {
        const square = BoardAdapter.coordinateToSquare(tilePos.tileX, tilePos.tileY);
        return this.chessEngine.getPossibleMoves(square);
    }

    public isInCheck(): boolean {
        return this.chessEngine.isCheck();
    }

    public isCheckmate(): boolean {
        return this.chessEngine.isCheckmate();
    }

    public isStalemate(): boolean {
        return this.chessEngine.isStalemate();
    }

    public isGameOver(): boolean {
        return this.chessEngine.isGameOver();
    }

    private syncWithChessEngine(): void {
        const currentTurn = player.isMyTurn() ? 'w' : 'b';
        const fen = BoardAdapter.buildFullFen(this.pieceMap, currentTurn);
        this.chessEngine.loadFen(fen);
    }

    private setupEventListeners(): void {
        // Listen for external move events
        this.gameBus.onMove((data) => {
            // Handle external moves (e.g., from other players or AI)
            console.log('External move received:', data);
        });
        
        this.gameBus.onTurn((data) => {
            console.log('Turn changed to:', data.player);
        });
    }

    private emitCurrentState(): void {
        const currentTurn = player.isMyTurn() ? 'white' : 'black';
        const history = this.chessEngine.getHistory();
        const legalMoves = this.chessEngine.getPossibleMoves();
        
        this.gameBus.emit('state', {
            fen: this.chessEngine.getFen(),
            turn: currentTurn,
            moveCount: history.length,
            inCheck: this.chessEngine.isCheck(),
            gameOver: this.chessEngine.isGameOver(),
            legalMoves,
            lastMove: history.length > 0 ? history[history.length - 1] : undefined
        });
        
        // Emit specific game state events
        if (this.chessEngine.isCheck()) {
            this.gameBus.emit('check', {});
        }
        
        if (this.chessEngine.isCheckmate()) {
            const winner = currentTurn === 'white' ? 'black' : 'white';
            this.gameBus.emit('checkmate', { winner });
        }
        
        if (this.chessEngine.isStalemate()) {
            this.gameBus.emit('stalemate', {});
        }
    }

    public getCurrentGameState(): any {
        const currentTurn = player.isMyTurn() ? 'white' : 'black';
        return {
            fen: this.chessEngine.getFen(),
            turn: currentTurn,
            moveCount: this.chessEngine.getHistory().length,
            inCheck: this.chessEngine.isCheck(),
            gameOver: this.chessEngine.isGameOver(),
            isStalemate: this.chessEngine.isStalemate(),
            lastMove: this.chessEngine.getHistory().slice(-1)[0] || null,
            timestamp: Date.now()
        };
    }

    public clearPreviousPossibleMoves(newPossibleMoves: Tile[]) {
        if (this.currentPossibleMoves) {
            this.previousPossibleMoves = this.currentPossibleMoves;
            this.previousPossibleMoves.forEach((tile) => {
                if (tile) tile.setAsNormal();
            });
        }
        this.currentPossibleMoves = newPossibleMoves;
    }

    public removePiecefromGame({ tileX, tileY }: TilePositionInterface) {
        this.pieces[tileY][tileX] = null;
        this.pieceMap[tileY][tileX] = '  ';
    }

    public undo() {
        const move = this.chessEngine.undoMove();
        if (move) {
            const currentBoard = gameHistory.getPreviousInteraction();
            this.updateDrawMap(currentBoard);
        }
    }

    public redo() {
        const currentBoard = gameHistory.getNextInteraction();
        this.updateDrawMap(currentBoard);
    }

    private updateDrawMap(currentBoard) {
        if (currentBoard) {
            this.pieceMap = _.cloneDeep(currentBoard);
            this.drawBoard();
        }
    }
}
