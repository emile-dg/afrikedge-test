import {RequirePermission} from '../authorization/require-permission.decorator';
import {Permission} from '../authorization/authorization.types';
import {Controller, Get} from '@nestjs/common';
import {VehiclesService} from './vehicles.service';
import type {TVehicle} from "@shared/types";
import {ApiOkResponse, ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {ApiErrors, vehicleResponseSchema} from '../common/swagger';

@ApiTags('Vehicles')
@ApiErrors(401, 403, 500, 503)
@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly service: VehiclesService) {
    }

    @Get()
    @ApiOkResponse({standardSchema: z.array(vehicleResponseSchema), description: 'Active vehicles'})
    @RequirePermission(Permission.VehiclesRead)
    findAll(): Promise<TVehicle[]> {
        return this.service.findAllActive();
    }
}
