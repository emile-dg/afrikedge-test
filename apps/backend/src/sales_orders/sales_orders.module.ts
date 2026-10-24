import {Module} from '@nestjs/common';
import {SalesOrdersController} from './sales_orders.controller';
import {SalesOrdersServices} from "./sales_orders.services";
import {SalesOrdersRepository} from "./sales_orders.repository";
import {DatabaseModule} from "../database/database.module";

@Module({
    imports: [DatabaseModule],
    controllers: [SalesOrdersController],
    providers: [SalesOrdersServices, SalesOrdersRepository],
    exports: [SalesOrdersServices]
})
export class SalesOrdersModule {
}
