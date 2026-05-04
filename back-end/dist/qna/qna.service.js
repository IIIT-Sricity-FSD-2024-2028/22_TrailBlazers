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
exports.QnaService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_FILE = path.join(process.cwd(), 'data', 'qna.json');
let QnaService = class QnaService {
    readFile() {
        try {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
        catch {
            return [];
        }
    }
    writeFile(items) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
    }
    nextId(items) {
        const nums = items
            .map((q) => parseInt(q.id.replace(/\D/g, ''), 10))
            .filter((n) => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        return `qna${max + 1}`;
    }
    findAll(eventId, status) {
        let result = this.readFile();
        if (eventId)
            result = result.filter((q) => q.eventId === eventId);
        if (status)
            result = result.filter((q) => q.status === status);
        return result;
    }
    findOne(id) {
        const item = this.readFile().find((q) => q.id === id);
        if (!item)
            throw new common_1.NotFoundException(`Q&A item "${id}" not found`);
        return item;
    }
    findByAttendee(email) {
        return this.readFile().filter((q) => q.askedBy === email);
    }
    create(dto) {
        const items = this.readFile();
        const newItem = {
            id: this.nextId(items),
            eventId: dto.eventId,
            question: dto.question,
            askedBy: dto.askedBy,
            status: 'unanswered',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        items.push(newItem);
        this.writeFile(items);
        return newItem;
    }
    answer(id, dto) {
        const items = this.readFile();
        const index = items.findIndex((q) => q.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Q&A item "${id}" not found`);
        items[index] = {
            ...items[index],
            answer: dto.answer,
            answeredBy: dto.answeredBy,
            answeredAt: new Date().toISOString(),
            status: 'answered',
            updatedAt: new Date().toISOString(),
        };
        this.writeFile(items);
        return items[index];
    }
    update(id, dto) {
        const items = this.readFile();
        const index = items.findIndex((q) => q.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Q&A item "${id}" not found`);
        items[index] = { ...items[index], ...dto, updatedAt: new Date().toISOString() };
        this.writeFile(items);
        return items[index];
    }
    remove(id) {
        const items = this.readFile();
        const index = items.findIndex((q) => q.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Q&A item "${id}" not found`);
        items.splice(index, 1);
        this.writeFile(items);
        return { message: `Q&A item "${id}" deleted` };
    }
    getStats(eventId) {
        const items = this.readFile().filter((q) => q.eventId === eventId);
        return {
            eventId,
            total: items.length,
            answered: items.filter((q) => q.status === 'answered').length,
            unanswered: items.filter((q) => q.status === 'unanswered').length,
        };
    }
};
exports.QnaService = QnaService;
exports.QnaService = QnaService = __decorate([
    (0, common_1.Injectable)()
], QnaService);
//# sourceMappingURL=qna.service.js.map