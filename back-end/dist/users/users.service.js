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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');
let UsersService = class UsersService {
    readFile() {
        try {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
        catch {
            return [];
        }
    }
    writeFile(users) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
    }
    nextId(users) {
        const nums = users
            .map((u) => parseInt(u.id.replace(/\D/g, ''), 10))
            .filter((n) => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        return `u${max + 1}`;
    }
    findAll(role) {
        const users = this.readFile();
        if (role)
            return users.filter((u) => u.role === role);
        return users;
    }
    findOne(id) {
        const user = this.readFile().find((u) => u.id === id);
        if (!user)
            throw new common_1.NotFoundException(`User "${id}" not found`);
        return user;
    }
    create(dto) {
        const users = this.readFile();
        const existing = users.find((u) => u.email === dto.email);
        if (existing)
            throw new common_1.ConflictException(`Email "${dto.email}" already registered`);
        const newUser = {
            id: this.nextId(users),
            name: dto.name,
            email: dto.email,
            role: dto.role,
            domain: dto.domain,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        users.push(newUser);
        this.writeFile(users);
        return newUser;
    }
    update(id, dto) {
        const users = this.readFile();
        const index = users.findIndex((u) => u.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`User "${id}" not found`);
        users[index] = { ...users[index], ...dto, updatedAt: new Date().toISOString() };
        this.writeFile(users);
        return users[index];
    }
    remove(id) {
        const users = this.readFile();
        const index = users.findIndex((u) => u.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`User "${id}" not found`);
        users.splice(index, 1);
        this.writeFile(users);
        return { message: `User "${id}" deleted` };
    }
    getStats() {
        const users = this.readFile();
        return {
            total: users.length,
            superusers: users.filter((u) => u.role === 'superuser').length,
            eventManagers: users.filter((u) => u.role === 'eventmanager').length,
            clients: users.filter((u) => u.role === 'client').length,
            oscStaff: users.filter((u) => u.role === 'osc').length,
            attendees: users.filter((u) => u.role === 'attendee').length,
            active: users.filter((u) => u.status === 'active').length,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map