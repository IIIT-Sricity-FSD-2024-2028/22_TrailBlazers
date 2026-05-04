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
exports.RsvpsService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_FILE = path.join(process.cwd(), 'data', 'rsvps.json');
let RsvpsService = class RsvpsService {
    readFile() {
        try {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
        catch {
            return [];
        }
    }
    writeFile(rsvps) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(rsvps, null, 2), 'utf-8');
    }
    nextId(rsvps) {
        const nums = rsvps
            .map((r) => parseInt(r.id.replace(/\D/g, ''), 10))
            .filter((n) => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        return `r${max + 1}`;
    }
    nextTicketCode(rsvps) {
        const nums = rsvps
            .map((r) => parseInt(r.ticketCode.replace(/\D/g, ''), 10))
            .filter((n) => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        return `TKT${String(max + 1).padStart(5, '0')}`;
    }
    findAll(eventId, status) {
        let result = this.readFile();
        if (eventId)
            result = result.filter((r) => r.eventId === eventId);
        if (status)
            result = result.filter((r) => r.status === status);
        return result;
    }
    findOne(id) {
        const rsvp = this.readFile().find((r) => r.id === id);
        if (!rsvp)
            throw new common_1.NotFoundException(`RSVP "${id}" not found`);
        return rsvp;
    }
    findByEmail(email) {
        return this.readFile().filter((r) => r.email === email);
    }
    create(dto) {
        const rsvps = this.readFile();
        const existing = rsvps.find((r) => r.eventId === dto.eventId && r.email === dto.email);
        if (existing)
            throw new common_1.ConflictException(`${dto.email} has already registered for this event`);
        const newRsvp = {
            id: this.nextId(rsvps),
            eventId: dto.eventId,
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            status: 'confirmed',
            ticketCode: this.nextTicketCode(rsvps),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        rsvps.push(newRsvp);
        this.writeFile(rsvps);
        return newRsvp;
    }
    update(id, dto) {
        const rsvps = this.readFile();
        const index = rsvps.findIndex((r) => r.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`RSVP "${id}" not found`);
        rsvps[index] = { ...rsvps[index], ...dto, updatedAt: new Date().toISOString() };
        this.writeFile(rsvps);
        return rsvps[index];
    }
    remove(id) {
        const rsvps = this.readFile();
        const index = rsvps.findIndex((r) => r.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`RSVP "${id}" not found`);
        rsvps.splice(index, 1);
        this.writeFile(rsvps);
        return { message: `RSVP "${id}" cancelled` };
    }
    checkIn(ticketCode) {
        const rsvps = this.readFile();
        const rsvp = rsvps.find((r) => r.ticketCode === ticketCode);
        if (!rsvp)
            throw new common_1.NotFoundException(`Ticket "${ticketCode}" not found`);
        if (rsvp.status === 'attended') {
            throw new common_1.ConflictException(`Ticket "${ticketCode}" already checked in`);
        }
        rsvp.status = 'attended';
        rsvp.updatedAt = new Date().toISOString();
        this.writeFile(rsvps);
        return rsvp;
    }
};
exports.RsvpsService = RsvpsService;
exports.RsvpsService = RsvpsService = __decorate([
    (0, common_1.Injectable)()
], RsvpsService);
//# sourceMappingURL=rsvps.service.js.map