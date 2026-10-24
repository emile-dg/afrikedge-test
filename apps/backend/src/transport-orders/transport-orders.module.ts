import {Module} from '@nestjs/common';
import {DatabaseModule} from '../database/database.module';
import {TransportOrdersService} from './transport-orders.service';
import {TransportOrdersController} from './transport-orders.controller';
import {TransportOrdersRepository} from './transport-orders.repository';

@Module({
    imports: [DatabaseModule],
    controllers: [TransportOrdersController],
    exports: [TransportOrdersService],
    providers: [TransportOrdersService, TransportOrdersRepository],
})
export class TransportOrdersModule {
}
