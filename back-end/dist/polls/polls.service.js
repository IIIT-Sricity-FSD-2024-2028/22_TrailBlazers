"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollsService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_FILE = path.join(process.cwd(), 'data', 'polls.json');
let PollsService = class PollsService {
    readFile() {
        try {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
        catch {
            return [];
        }
    }
    writeFile(polls) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(polls, null, 2), 'utf-8');
    }
    nextId(polls) {
        const nums = polls
            .map((p) => parseInt(p.id.replace(/\D/g, ''), 10))
            .filter((n) => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        return `poll${max + 1}`;
    }
    findAll(eventId, status) {
        let result = this.readFile();
        if (eventId)
            result = result.filter((p) => p.eventId === eventId);
        if (status)
            result = result.filter((p) => p.status === status);
        return result;
    }
    findOne(id) {
        const poll = this.readFile().find((p) => p.id === id);
        if (!poll)
            throw new common_1.NotFoundException(`Poll "${id}" not found`);
        return poll;
    }
    findByEvent(eventId) {
        return this.readFile().filter((p) => p.eventId === eventId);
    }
    create(dto) {
        const polls = this.readFile();
        const newPoll = {
            id: this.nextId(polls),
            eventId: dto.eventId,
            question: dto.question,
            options: dto.options.map((label) => ({ label, votes: 0, voters: [] })),
            status: 'open',
            createdBy: dto.createdBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        polls.push(newPoll);
        this.writeFile(polls);
        return newPoll;
    }
    vote(id, dto) {
        const polls = this.readFile();
        const poll = polls.find((p) => p.id === id);
        if (!poll)
            throw new common_1.NotFoundException(`Poll "${id}" not found`);
        if (poll.status === 'closed') {
            throw new common_1.BadRequestException(`Poll "${id}" is closed and no longer accepting votes`);
        }
        const hasVoted = poll.options.some((opt) => opt.voters.includes(dto.voterEmail));
        if (hasVoted) {
            throw new common_1.ConflictException(`"${dto.voterEmail}" has already voted in this poll`);
        }
        const option = poll.options.find((opt) => opt.label === dto.option);
        if (!option) {
            throw new common_1.BadRequestException(`Invalid option "${dto.option}". Valid options: ${poll.options.map((o) => o.label).join(', ')}`);
        }
        option.votes += 1;
        option.voters.push(dto.voterEmail);
        poll.updatedAt = new Date().toISOString();
        this.writeFile(polls);
        return poll;
    }
    update(id, dto) {
        const polls = this.readFile();
        const index = polls.findIndex((p) => p.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Poll "${id}" not found`);
        const existing = polls[index];
        let updatedOptions = existing.options;
        if (dto.options) {
            updatedOptions = dto.options.map((label) => ({ label, votes: 0, voters: [] }));
        }
        polls[index] = {
            ...existing,
            question: dto.question ?? existing.question,
            options: updatedOptions,
            status: dto.status ?? existing.status,
            updatedAt: new Date().toISOString(),
        };
        this.writeFile(polls);
        return polls[index];
    }
    close(id) {
        const polls = this.readFile();
        const poll = polls.find((p) => p.id === id);
        if (!poll)
            throw new common_1.NotFoundException(`Poll "${id}" not found`);
        poll.status = 'closed';
        poll.updatedAt = new Date().toISOString();
        this.writeFile(polls);
        return poll;
    }
    remove(id) {
        const polls = this.readFile();
        const index = polls.findIndex((p) => p.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Poll "${id}" not found`);
        polls.splice(index, 1);
        this.writeFile(polls);
        return { message: `Poll "${id}" deleted` };
    }
    getResults(id) {
        const poll = this.findOne(id);
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
        return {
            pollId: poll.id,
            question: poll.question,
            status: poll.status,
            totalVotes,
            results: poll.options.map((opt) => ({
                option: opt.label,
                votes: opt.votes,
                percentage: totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(1) + '%' : '0%',
            })),
        };
    }
};
exports.PollsService = PollsService;
exports.PollsService = PollsService = __decorate([
    (0, common_1.Injectable)()
], PollsService);
//# sourceMappingURL=polls.service.js.map