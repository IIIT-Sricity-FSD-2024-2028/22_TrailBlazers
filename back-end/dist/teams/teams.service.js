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
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_FILE = path.join(process.cwd(), 'data', 'teams.json');
let TeamsService = class TeamsService {
    readFile() {
        try {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
        catch {
            return [];
        }
    }
    writeFile(members) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2), 'utf-8');
    }
    nextId(members) {
        const nums = members
            .map((m) => parseInt(m.id.replace(/\D/g, ''), 10))
            .filter((n) => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        return `tm${max + 1}`;
    }
    findAll(eventId, status) {
        let result = this.readFile();
        if (eventId)
            result = result.filter((m) => m.eventId === eventId);
        if (status)
            result = result.filter((m) => m.status === status);
        return result;
    }
    findOne(id) {
        const member = this.readFile().find((m) => m.id === id);
        if (!member)
            throw new common_1.NotFoundException(`Team member "${id}" not found`);
        return member;
    }
    create(dto) {
        const members = this.readFile();
        const newMember = {
            id: this.nextId(members),
            name: dto.name,
            email: dto.email,
            teamRole: dto.teamRole,
            eventId: dto.eventId,
            status: 'active',
            scansCompleted: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        members.push(newMember);
        this.writeFile(members);
        return newMember;
    }
    update(id, dto) {
        const members = this.readFile();
        const index = members.findIndex((m) => m.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Team member "${id}" not found`);
        members[index] = { ...members[index], ...dto, updatedAt: new Date().toISOString() };
        this.writeFile(members);
        return members[index];
    }
    remove(id) {
        const members = this.readFile();
        const index = members.findIndex((m) => m.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Team member "${id}" not found`);
        members.splice(index, 1);
        this.writeFile(members);
        return { message: `Team member "${id}" removed` };
    }
    getStats(eventId) {
        const members = this.readFile().filter((m) => m.eventId === eventId);
        return {
            total: members.length,
            active: members.filter((m) => m.status === 'active').length,
            onBreak: members.filter((m) => m.status === 'break').length,
            offline: members.filter((m) => m.status === 'offline').length,
            totalScans: members.reduce((sum, m) => sum + m.scansCompleted, 0),
        };
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)()
], TeamsService);
//# sourceMappingURL=teams.service.js.map