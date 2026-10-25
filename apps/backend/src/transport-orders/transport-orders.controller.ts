import {CurrentUser} from '../authorization/current-user.decorator';
import {RequirePermission} from '../authorization/require-permission.decorator';
import {Permission} from '../authorization/authorization.types';
import type {ResolvedUser} from '../authorization/authorization.types';
import {Body, Controller, Delete, Get, HttpCode, Param, Post, Query} from '@nestjs/common';
import {ZodValidationPipe} from '../common/pipes/zod-validation.pipe';
import {TransportOrdersService} from './transport-orders.service';
import {addTransportLinesSchema, createTransportOrderSchema, transportIdentifierSchema, transportOrderQuerySchema} from './transport-orders.schema';
import type {AddTransportLines} from './transport-orders.schema';
import type {CreateTransportOrder, TransportOrderQuery} from './transport-orders.types';

@Controller('transport-orders')
export class TransportOrdersController {
    constructor(private readonly service: TransportOrdersService) {
    }

    @Get()
    @RequirePermission(Permission.TransportOrdersRead)
    findAll(@Query(new ZodValidationPipe(transportOrderQuerySchema)) query: TransportOrderQuery) {
        return this.service.findAll(query);
    }

    @Get(':no')
    @RequirePermission(Permission.TransportOrdersRead)
    findOne(@Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string) {
        return this.service.findOne(no);
    }

    @Post()
    @RequirePermission(Permission.TransportOrdersCreate)
    create(
        @Body(new ZodValidationPipe(createTransportOrderSchema)) body: CreateTransportOrder,
        @CurrentUser() user: ResolvedUser,
    ) {
        return this.service.create(body, user.id);
    }

    @Post(':no/lines')
    @RequirePermission(Permission.TransportOrdersLinesAdd)
    @HttpCode(200)
    addLines(
        @Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string,
        @Body(new ZodValidationPipe(addTransportLinesSchema)) body: AddTransportLines,
    ) {
        return this.service.addLines(no, body.salesOrderNos);
    }

    @Delete(':no/lines/:salesOrderNo')
    @RequirePermission(Permission.TransportOrdersLinesRemove)
    @HttpCode(204)
    removeLine(
        @Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string,
        @Param('salesOrderNo', new ZodValidationPipe(transportIdentifierSchema)) salesOrderNo: string,
    ) {
        return this.service.removeLine(no, salesOrderNo);
    }

    @Post(':no/validate')
    @RequirePermission(Permission.TransportOrdersValidate)
    @HttpCode(200)
    validate(
        @Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string,
        @CurrentUser() user: ResolvedUser,
    ) {
        return this.service.validate(no, user.id);
    }

    @Post(':no/depart')
    @RequirePermission(Permission.TransportOrdersDepart)
    @HttpCode(200)
    depart(@Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string) {
        return this.service.depart(no);
    }
}
