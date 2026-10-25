export type TSalesOrder = {
    no: string
    customerNo: string
    customerName: string
    deliveryCity: string
    totalWeightKg: number
    status: number
}

export interface TVehicle {
    code: string
    plateNo: string
    capacityKg: number
    active: boolean
}
