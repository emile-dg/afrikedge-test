import {RequirePermission} from '../authorization/require-permission.decorator';
import {Permission} from '../authorization/authorization.types';
import {Controller, Get} from '@nestjs/common';
import {VehiclesService} from './vehicles.service';
import type {TVehicle} from "@shared/types";

@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly service: VehiclesService) {
    }

    @Get()
    @RequirePermission(Permission.VehiclesRead)
    findAll(): Promise<TVehicle[]> {
        return this.service.findAllActive();
    }
}
