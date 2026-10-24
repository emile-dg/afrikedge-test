export enum SalesOrderStatus {
    Pending = 0,
    Planned = 1,
    Ongoing = 2,
}

export type TGetSalesOrdersFilters = {
    status?: SalesOrderStatus;
};