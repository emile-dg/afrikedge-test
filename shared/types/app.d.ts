export type TSalesOrder = {
    no: string
    customer_no: string
    Customer_name: string
    delivery_city: string
    total_weight_kg: string
    status: number
}

export interface TVehicle {
    code: string
    plateNo: string
    capacityKg: number
    active: boolean
}
