"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GameService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const match_service_1 = require("../match/match.service");
let GameService = GameService_1 = class GameService {
    matchService;
    logger = new common_1.Logger(GameService_1.name);
    lobby = [];
    activeMatches = new Map();
    constructor(matchService) {
        this.matchService = matchService;
    }
    addPlayerToLobby(socket, player) {
        this.logger.log(`Player ${player.username} (${socket.id}) joining lobby.`);
        if (this.lobby.some(p => p.player.id === player.id)) {
            socket.emit('error', 'You are already in the lobby.');
            return;
        }
        this.lobby.push({ socket, player });
        socket.emit('lobbyJoined', { message: `Welcome ${player.username}, you are in the lobby.` });
        if (this.lobby.length >= 2) {
            this.logger.log('Two players in lobby. Creating a match.');
            const player1Info = this.lobby.shift();
            const player2Info = this.lobby.shift();
            if (!player1Info || !player2Info) {
                this.logger.error('Failed to create match: insufficient players in lobby');
                return;
            }
            this.matchService.createMatch(player1Info.player, player2Info.player)
                .then(match => {
                const matchRoom = `match_${match.id}`;
                player1Info.socket.join(matchRoom);
                player2Info.socket.join(matchRoom);
                const playersMap = new Map();
                playersMap.set(player1Info.player.id, player1Info.socket);
                playersMap.set(player2Info.player.id, player2Info.socket);
                this.activeMatches.set(match.id, { matchId: match.id, players: playersMap });
                player1Info.socket.emit('matchStart', { matchId: match.id, opponent: player2Info.player.username });
                player2Info.socket.emit('matchStart', { matchId: match.id, opponent: player1Info.player.username });
            });
        }
    }
    handleReconnect(player, newSocket) {
        for (const [matchId, match] of this.activeMatches.entries()) {
            if (match.players.has(player.id)) {
                this.logger.log(`Player ${player.username} is reconnecting to match ${matchId}`);
                match.players.set(player.id, newSocket);
                newSocket.join(`match_${matchId}`);
                this.matchService.handlePlayerReconnect(matchId, player.id);
                return;
            }
        }
    }
    handleDisconnect(client) {
        const disconnectedPlayerId = client.player?.id;
        if (!disconnectedPlayerId)
            return;
        this.removePlayerFromLobby(client);
        for (const [matchId, match] of this.activeMatches.entries()) {
            if (match.players.has(disconnectedPlayerId)) {
                this.logger.log(`Player ${disconnectedPlayerId} from match ${matchId} has disconnected.`);
                this.matchService.handlePlayerDisconnect(matchId, disconnectedPlayerId);
                break;
            }
        }
    }
    concludeMatch(matchId) {
        this.activeMatches.delete(matchId);
        this.logger.log(`Match ${matchId} concluded and removed from active tracking.`);
    }
    removePlayerFromLobby(socket) {
        const initialLobbySize = this.lobby.length;
        this.lobby = this.lobby.filter(p => p.socket.id !== socket.id);
        if (this.lobby.length < initialLobbySize) {
            this.logger.log(`Player ${socket.id} removed from lobby.`);
        }
    }
};
exports.GameService = GameService;
exports.GameService = GameService = GameService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => match_service_1.MatchService))),
    __metadata("design:paramtypes", [match_service_1.MatchService])
], GameService);
//# sourceMappingURL=game.service.js.map