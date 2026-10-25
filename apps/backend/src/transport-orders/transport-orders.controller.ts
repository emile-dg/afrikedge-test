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
import {ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiParam, ApiTags} from '@nestjs/swagger';
import {ApiErrors, ApiZodBody, ApiZodQuery, paginatedResponseSchema, transportDetailsResponseSchema, transportSummaryResponseSchema} from '../common/swagger';

@ApiTags('Transport orders')
@ApiErrors(400, 401, 403, 404, 409, 500, 503)
@Controller('transport-orders')
export class TransportOrdersController {
    constructor(private readonly service: TransportOrdersService) {
    }

    @Get()
    @ApiZodQuery(transportOrderQuerySchema)
    @ApiOkResponse({standardSchema: paginatedResponseSchema(transportSummaryResponseSchema)})
    @RequirePermission(Permission.TransportOrdersRead)
    findAll(@Query(new ZodValidationPipe(transportOrderQuerySchema)) query: TransportOrderQuery) {
        return this.service.findAll(query);
    }

    @Get(':no')
    @ApiParam({name: 'no', schema: {type: 'string', minLength: 1, maxLength: 20}, example: 'TO-0001'})
    @ApiOkResponse({standardSchema: transportDetailsResponseSchema})
    @RequirePermission(Permission.TransportOrdersRead)
    findOne(@Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string) {
        return this.service.findOne(no);
    }

    @Post()
    @ApiZodBody(createTransportOrderSchema)
    @ApiCreatedResponse({standardSchema: transportDetailsResponseSchema})
    @RequirePermission(Permission.TransportOrdersCreate)
    create(
        @Body(new ZodValidationPipe(createTransportOrderSchema)) body: CreateTransportOrder,
        @CurrentUser() user: ResolvedUser,
    ) {
        return this.service.create(body, user.id);
    }

    @Post(':no/lines')
    @ApiParam({name: 'no', schema: {type: 'string', minLength: 1, maxLength: 20}})
    @ApiZodBody(addTransportLinesSchema)
    @ApiOkResponse({standardSchema: transportDetailsResponseSchema})
    @RequirePermission(Permission.TransportOrdersLinesAdd)
    @HttpCode(200)
    addLines(
        @Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string,
        @Body(new ZodValidationPipe(addTransportLinesSchema)) body: AddTransportLines,
    ) {
        return this.service.addLines(no, body.salesOrderNos);
    }

    @Delete(':no/lines/:salesOrderNo')
    @ApiParam({name: 'no', schema: {type: 'string', minLength: 1, maxLength: 20}})
    @ApiParam({name: 'salesOrderNo', schema: {type: 'string', minLength: 1, maxLength: 20}})
    @ApiNoContentResponse({description: 'Assignment removed'})
    @RequirePermission(Permission.TransportOrdersLinesRemove)
    @HttpCode(204)
    removeLine(
        @Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string,
        @Param('salesOrderNo', new ZodValidationPipe(transportIdentifierSchema)) salesOrderNo: string,
    ) {
        return this.service.removeLine(no, salesOrderNo);
    }

    @Post(':no/validate')
    @ApiParam({name: 'no', schema: {type: 'string', minLength: 1, maxLength: 20}})
    @ApiOkResponse({standardSchema: transportDetailsResponseSchema, description: 'Validated transport; logistics manager permission required'})
    @RequirePermission(Permission.TransportOrdersValidate)
    @HttpCode(200)
    validate(
        @Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string,
        @CurrentUser() user: ResolvedUser,
    ) {
        return this.service.validate(no, user.id);
    }

    @Post(':no/depart')
    @ApiParam({name: 'no', schema: {type: 'string', minLength: 1, maxLength: 20}})
    @ApiOkResponse({standardSchema: transportDetailsResponseSchema})
    @RequirePermission(Permission.TransportOrdersDepart)
    @HttpCode(200)
    depart(@Param('no', new ZodValidationPipe(transportIdentifierSchema)) no: string) {
        return this.service.depart(no);
    }
}
