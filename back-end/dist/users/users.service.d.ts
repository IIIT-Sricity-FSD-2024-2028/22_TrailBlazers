export interface User {
    id: string;
    name: string;
    email: string;
    role: 'superuser' | 'eventmanager' | 'client' | 'osc' | 'attendee';
    domain?: string;
    status: 'active' | 'inactive' | 'suspended';
    createdAt: string;
    updatedAt: string;
}
export declare class UsersService {
    private readFile;
    private writeFile;
    private nextId;
    findAll(role?: string): User[];
    findOne(id: string): User;
    create(dto: any): User;
    update(id: string, dto: any): User;
    remove(id: string): {
        message: string;
    };
    getStats(): object;
}
