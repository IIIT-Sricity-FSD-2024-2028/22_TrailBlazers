import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(role?: string): import("./users.service").User[];
    getStats(): object;
    findOne(id: string): import("./users.service").User;
    create(dto: CreateUserDto): import("./users.service").User;
    update(id: string, dto: UpdateUserDto): import("./users.service").User;
    remove(id: string): {
        message: string;
    };
}
