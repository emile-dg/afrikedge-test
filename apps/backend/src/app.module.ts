import {AuthorizationModule} from './authorization/authorization.module';
import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {z} from 'zod';
import {VehiclesModule} from './vehicles/vehicles.module';
import { SalesOrdersModule } from './sales_orders/sales_orders.module';
import { TransportOrdersModule } from './transport-orders/transport-orders.module';

const schema = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    CORS_ORIGIN: z.url().default('http://localhost:5173'),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(1433),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_ENCRYPT: z.enum(['true', 'false']).default('true'),
    DB_TRUST_SERVER_CERTIFICATE: z.enum(['true', 'false']).default('false'),
}).loose();

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true, validationSchema: schema}),
        AuthorizationModule,
        VehiclesModule,
        SalesOrdersModule,
        TransportOrdersModule,
    ]
})
export class AppModule {
}
