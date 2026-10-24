import {Module} from '@nestjs/common';
import {DatabaseModule} from '../database/database.module';
import {VehiclesController} from './vehicles.controller';
import {VehiclesService} from './vehicles.service';
import {VehiclesRepository} from './vehicles.repository';

@Module({
    imports: [DatabaseModule],
    controllers: [VehiclesController],
    providers: [VehiclesService, VehiclesRepository],
    exports: [VehiclesService],
})
export class VehiclesModule {
}
