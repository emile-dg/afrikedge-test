import {Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Query} from '@nestjs/common';
import {ZodValidationPipe} from '../common/pipes/zod-validation.pipe';
import {TransportOrdersService} from './transport-orders.service';
import {addTransportLinesSchema, createTransportOrderSchema, transportIdentifierSchema, transportOrderQuerySchema, transportUserSchema} from './transport-orders.schema';
import type {AddTransportLines} from './transport-orders.schema';
import type {CreateTransportOrder, TransportOrderQuery} from './transport-orders.types';

@Controller('transport-orders')
export class TransportOrdersController {
    constructor(private readonly service: TransportOrdersService) {
    }

    @Get()
    findAll(@Query(new ZodValidationPipe(transportOrderQuerySchema)) query: TransportOrderQuery) {
        return this.service.findAll(query);
    }

    @Get(':no')
    findOne(@Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string) {
        return this.service.findOne(no);
    }

    @Post()
    create(
        @Body(new ZodValidationPipe(createTransportOrderSchema)) body: CreateTransportOrder,
        @Headers('x-user-id') userId: unknown,
    ) {
        return this.service.create(body, new ZodValidationPipe(transportUserSchema).transform(userId));
    }

    @Post(':no/lines')
    @HttpCode(200)
    addLines(
        @Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string,
        @Body(new ZodValidationPipe(addTransportLinesSchema)) body: AddTransportLines,
    ) {
        return this.service.addLines(no, body.salesOrderNos);
    }

    @Delete(':no/lines/:salesOrderNo')
    @HttpCode(204)
    removeLine(
        @Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string,
        @Param('salesOrderNo', new ZodValidationPipe(transportIdentifierSchema)) salesOrderNo: string,
    ) {
        return this.service.removeLine(no, salesOrderNo);
    }

    @Post(':no/validate')
    @HttpCode(200)
    validate(
        @Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string,
        @Headers('x-user-id') userId: unknown,
    ) {
        return this.service.validate(no, new ZodValidationPipe(transportUserSchema).transform(userId));
    }

    @Post(':no/depart')
    @HttpCode(200)
    depart(@Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string) {
        return this.service.depart(no);
    }
}
