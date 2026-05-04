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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_FILE = path.join(process.cwd(), 'data', 'notifications.json');
let NotificationsService = class NotificationsService {
    readFile() {
        try {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
        catch {
            return [];
        }
    }
    writeFile(notifications) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(notifications, null, 2), 'utf-8');
    }
    nextId(notifications) {
        const nums = notifications
            .map((n) => parseInt(n.id.replace(/\D/g, ''), 10))
            .filter((n) => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        return `n${max + 1}`;
    }
    findAll(eventId, isRead) {
        let result = this.readFile();
        if (eventId)
            result = result.filter((n) => n.eventId === eventId);
        if (isRead !== undefined)
            result = result.filter((n) => n.isRead === (isRead === 'true'));
        return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    findOne(id) {
        const notif = this.readFile().find((n) => n.id === id);
        if (!notif)
            throw new common_1.NotFoundException(`Notification "${id}" not found`);
        return notif;
    }
    create(dto) {
        const notifications = this.readFile();
        const newNotif = {
            id: this.nextId(notifications),
            title: dto.title,
            desc: dto.desc,
            priority: dto.priority,
            reporter: dto.reporter || 'Team Member',
            eventId: dto.eventId,
            isRead: false,
            status: 'open',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString(),
        };
        notifications.unshift(newNotif);
        this.writeFile(notifications);
        return newNotif;
    }
    update(id, dto) {
        const notifications = this.readFile();
        const index = notifications.findIndex((n) => n.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Notification "${id}" not found`);
        notifications[index] = { ...notifications[index], ...dto };
        this.writeFile(notifications);
        return notifications[index];
    }
    resolve(id) {
        return this.update(id, { status: 'resolved', isRead: true });
    }
    remove(id) {
        const notifications = this.readFile();
        const index = notifications.findIndex((n) => n.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Notification "${id}" not found`);
        notifications.splice(index, 1);
        this.writeFile(notifications);
        return { message: `Notification "${id}" deleted` };
    }
    getUnreadCount() {
        const notifications = this.readFile();
        return { count: notifications.filter((n) => !n.isRead && n.status === 'open').length };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)()
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map