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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_FILE = path.join(process.cwd(), 'data', 'events.json');
let EventsService = class EventsService {
    readFile() {
        try {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            return [];
        }
    }
    writeFile(events) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2), 'utf-8');
    }
    nextId(events) {
        const nums = events
            .map((e) => parseInt(e.id.replace(/\D/g, ''), 10))
            .filter((n) => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        return `e${max + 1}`;
    }
    findAll(status, managerId) {
        let events = this.readFile();
        const validStatuses = ['pending', 'upcoming', 'live', 'completed'];
        if (status && validStatuses.includes(status)) {
            events = events.filter((e) => e.status === status);
        }
        if (managerId && /^u\d+$/.test(managerId)) {
            events = events.filter((e) => e.managerId === managerId);
        }
        return events;
    }
    findOne(id) {
        const events = this.readFile();
        const event = events.find((e) => e.id === id);
        if (!event)
            throw new common_1.NotFoundException(`Event with ID "${id}" not found`);
        return event;
    }
    create(dto) {
        const events = this.readFile();
        const timeline = dto.timeline || [];
        const uniqueSpeakers = new Set(timeline.map((s) => s.speaker)).size;
        const newEvent = {
            id: this.nextId(events),
            title: dto.title,
            status: dto.status || 'pending',
            date: dto.date,
            location: dto.location,
            capacity: dto.capacity,
            domain: dto.domain,
            description: dto.description,
            managerId: dto.managerId,
            managerName: dto.managerName,
            attendees: 0,
            sessions: timeline.length,
            speakers: uniqueSpeakers,
            timeline,
            stats: dto.stats || {
                rsvps: 0,
                checkins: 0,
                engagement: 0,
                rating: 0,
                participationTrend: [],
                feedbackScore: 0,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        events.unshift(newEvent);
        this.writeFile(events);
        return newEvent;
    }
    update(id, dto) {
        const events = this.readFile();
        const index = events.findIndex((e) => e.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Event with ID "${id}" not found`);
        const existing = events[index];
        const timeline = dto.timeline !== undefined ? dto.timeline : existing.timeline;
        const uniqueSpeakers = timeline
            ? new Set(timeline.map((s) => s.speaker)).size
            : existing.speakers;
        events[index] = {
            ...existing,
            ...dto,
            sessions: timeline ? timeline.length : existing.sessions,
            speakers: uniqueSpeakers,
            timeline,
            updatedAt: new Date().toISOString(),
        };
        this.writeFile(events);
        return events[index];
    }
    remove(id) {
        const events = this.readFile();
        const index = events.findIndex((e) => e.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Event with ID "${id}" not found`);
        events.splice(index, 1);
        this.writeFile(events);
        return { message: `Event "${id}" deleted successfully` };
    }
    getDashboardStats(managerId) {
        const all = this.readFile();
        const events = managerId ? all.filter((e) => e.managerId === managerId) : all;
        const active = events.filter((e) => e.status === 'live' || e.status === 'upcoming');
        const completed = events.filter((e) => e.status === 'completed');
        let totalRSVPs = 0;
        let ratingSum = 0;
        let engagementSum = 0;
        let ratingCount = 0;
        events.forEach((e) => {
            if (e.stats) {
                totalRSVPs += e.stats.rsvps || 0;
                if (e.stats.rating) {
                    ratingCount++;
                    ratingSum += e.stats.rating;
                    engagementSum += e.stats.engagement || 0;
                }
            }
        });
        return {
            totalEvents: events.length,
            activeEventsCount: active.length,
            completedEventsCount: completed.length,
            pendingEventsCount: events.filter((e) => e.status === 'pending').length,
            totalRSVPs,
            avgRating: ratingCount ? parseFloat((ratingSum / ratingCount).toFixed(1)) : 0,
            engagementScore: ratingCount ? parseFloat((engagementSum / ratingCount).toFixed(1)) : 0,
            totalHosted: events.length,
        };
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)()
], EventsService);
//# sourceMappingURL=events.service.js.map