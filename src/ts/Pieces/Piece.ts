import * as _ from 'lodash';
import {
    board, enemy, player, scene
} from '../App';
import Tile from '../Board/Tile';
import isCheck from '../Board/check';
import { makeAnimation } from '../Utils/utils';
import {
    PieceInterface, TilePositionInterface, PiecesColors, PiecesType, PositionInterface
} from '../game.interfaces';
import * as utils from '../Utils/utils';
import { BoardAdapter } from '../BoardAdapter';

export default class Piece extends Phaser.GameObjects.Sprite implements PieceInterface {
    protected currentTile: TilePositionInterface;
    public color: PiecesColors;
    public type: PiecesType;
    public firstTurn = true;

    constructor({ positionX, positionY }: PositionInterface, color: PiecesColors, type: PiecesType, imageName: string) {
        super(scene, positionX, positionY, imageName, 0);
        scene.add.existing(this);
        scene.physics.world.enable(this);

        this.currentTile = utils.converToTileSize({ positionX, positionY });
        this.color = color;
        this.type = type;
    }

    public getTile() {
        return this.currentTile;
    }

    public isPlayerPiece(): boolean {
        if (this.color === PiecesColors.BLACK) return false;
        return true;
    }

    // eslint-disable-next-line class-methods-use-this
    public showPossibleMoves(tiles: Tile[] | void, isKingCheck:boolean = true): Tile[] {
        if (player.isMyTurn() && isKingCheck) {
            board.clearPreviousPossibleMoves(tiles as Tile[]);
            
            // Use chess.js validation instead of custom check logic
            const validTiles: Tile[] = [];
            const possibleMoves = board.getPossibleMovesForPiece(this.currentTile);
            
            possibleMoves.forEach(moveSquare => {
                const coord = BoardAdapter.squareToCoordinate(moveSquare);
                const tile = board.getTiles(coord) as Tile;
                if (tile && board.isTileFree(tile)) {
                    validTiles.push(tile);
                    tile.setAsPossibleMove();
                }
            });
            
            board.currentPossibleMoves = validTiles;
        }

        return tiles as Tile[];
    }

    public async to(newTile: Tile) {
        // Validate move with chess.js before executing
        if (!board.isValidMove(this.currentTile, newTile.tilePosition)) {
            return;
        }
        
        this.firstTurn = false;
        const previousTile = this.currentTile;
        this.currentTile = newTile.tilePosition;
        board.updateMap(previousTile, this.currentTile, this);
        await makeAnimation(this, { 
            x: newTile.position.positionX, 
            y: newTile.position.positionY
        }, 150);
    }

    // eslint-disable-next-line class-methods-use-this
    public eat(piece: Piece) {
        board.removePiecefromGame(piece.getTile());
        piece.destroy();
        if (piece.color === PiecesColors.BLACK) enemy.removePieceFromArray(piece);
        else player.removePieceFromArray(piece);
    }

    public movementTileExposingKing(tiles:Tile): Tile[] {
        return [tiles];
    }
}

//return Car.prototype.carBoundary.call( this, this.direction, this.currentTilePosition  )