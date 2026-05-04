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
exports.PendingRequestsService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_FILE = path.join(process.cwd(), 'data', 'pending-requests.json');
let PendingRequestsService = class PendingRequestsService {
    readFile() {
        try {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
        catch {
            return [];
        }
    }
    writeFile(requests) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2), 'utf-8');
    }
    nextId(requests) {
        const nums = requests
            .map((r) => parseInt(r.id.replace(/\D/g, ''), 10))
            .filter((n) => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        return `pr${max + 1}`;
    }
    findAll(status) {
        const requests = this.readFile();
        if (status)
            return requests.filter((r) => r.status === status);
        return requests;
    }
    findOne(id) {
        const req = this.readFile().find((r) => r.id === id);
        if (!req)
            throw new common_1.NotFoundException(`Request "${id}" not found`);
        return req;
    }
    create(dto) {
        const requests = this.readFile();
        const newReq = {
            id: this.nextId(requests),
            ...dto,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        requests.push(newReq);
        this.writeFile(requests);
        return newReq;
    }
    review(id, dto) {
        const requests = this.readFile();
        const index = requests.findIndex((r) => r.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Request "${id}" not found`);
        if (requests[index].status !== 'Pending') {
            throw new common_1.BadRequestException(`Request "${id}" has already been reviewed`);
        }
        if (dto.decision === 'approved') {
            if (!dto.managerId)
                throw new common_1.BadRequestException('managerId is required for approval');
            requests[index] = {
                ...requests[index],
                status: 'Approved',
                managerId: dto.managerId,
                managerName: dto.managerName,
                updatedAt: new Date().toISOString(),
            };
        }
        else {
            requests[index] = {
                ...requests[index],
                status: 'Rejected',
                rejectionReason: dto.rejectionReason || 'No reason provided',
                updatedAt: new Date().toISOString(),
            };
        }
        this.writeFile(requests);
        return requests[index];
    }
    remove(id) {
        const requests = this.readFile();
        const index = requests.findIndex((r) => r.id === id);
        if (index === -1)
            throw new common_1.NotFoundException(`Request "${id}" not found`);
        requests.splice(index, 1);
        this.writeFile(requests);
        return { message: `Request "${id}" deleted` };
    }
};
exports.PendingRequestsService = PendingRequestsService;
exports.PendingRequestsService = PendingRequestsService = __decorate([
    (0, common_1.Injectable)()
], PendingRequestsService);
//# sourceMappingURL=pending-requests.service.js.map