import type {TSalesOrder, TVehicle, TransportSummary} from './contracts'
import {offsetDate} from '../utils/format'

const vehicles: TVehicle[] = [
    {
        "code": "VH-01",
        "plateNo": "LT-482-AB",
        "capacityKg": 1500,
        "active": true
    },
    {
        "code": "VH-02",
        "plateNo": "LT-219-CD",
        "capacityKg": 2500,
        "active": true
    },
    {
        "code": "VH-03",
        "plateNo": "CE-731-EF",
        "capacityKg": 3500,
        "active": true
    },
    {
        "code": "VH-04",
        "plateNo": "LT-905-GH",
        "capacityKg": 5000,
        "active": true
    },
    {
        "code": "VH-05",
        "plateNo": "OU-144-JK",
        "capacityKg": 5000,
        "active": true
    },
    {
        "code": "VH-06",
        "plateNo": "CE-562-LM",
        "capacityKg": 8000,
        "active": true
    },
    {
        "code": "VH-07",
        "plateNo": "LT-377-NP",
        "capacityKg": 3500,
        "active": false
    },
    {
        "code": "VH-08",
        "plateNo": "SU-628-QR",
        "capacityKg": 10000,
        "active": true
    },
    {
        "code": "VH-09",
        "plateNo": "LT-810-ST",
        "capacityKg": 1200,
        "active": true
    },
    {
        "code": "VH-10",
        "plateNo": "CE-093-UV",
        "capacityKg": 2000,
        "active": true
    }
]
const salesOrders: TSalesOrder[] = [
    {
        "no": "SO-1001",
        "customerNo": "C0001",
        "customerName": "Quincaillerie Ndokoti",
        "deliveryCity": "Douala",
        "totalWeightKg": 850,
        "status": 2
    },
    {
        "no": "SO-1002",
        "customerNo": "C0002",
        "customerName": "Supermarché Akwa Centre",
        "deliveryCity": "Douala",
        "totalWeightKg": 1200,
        "status": 2
    },
    {
        "no": "SO-1003",
        "customerNo": "C0003",
        "customerName": "Pharmacie du Plateau",
        "deliveryCity": "Yaoundé",
        "totalWeightKg": 1100,
        "status": 1
    },
    {
        "no": "SO-1004",
        "customerNo": "C0004",
        "customerName": "Boulangerie La Bonne Miche",
        "deliveryCity": "Yaoundé",
        "totalWeightKg": 950,
        "status": 1
    },
    {
        "no": "SO-1005",
        "customerNo": "C0005",
        "customerName": "Établissements Fotso et Fils",
        "deliveryCity": "Yaoundé",
        "totalWeightKg": 1300,
        "status": 1
    },
    {
        "no": "SO-1006",
        "customerNo": "C0006",
        "customerName": "Agro Distribution Ouest",
        "deliveryCity": "Bafoussam",
        "totalWeightKg": 640,
        "status": 1
    },
    {
        "no": "SO-1007",
        "customerNo": "C0007",
        "customerName": "Café Mont Bamboutos",
        "deliveryCity": "Bafoussam",
        "totalWeightKg": 720,
        "status": 1
    },
    {
        "no": "SO-1008",
        "customerNo": "C0001",
        "customerName": "Quincaillerie Ndokoti",
        "deliveryCity": "Douala",
        "totalWeightKg": 430,
        "status": 0
    },
    {
        "no": "SO-1009",
        "customerNo": "C0008",
        "customerName": "Hôtel Kribi Plage",
        "deliveryCity": "Kribi",
        "totalWeightKg": 380,
        "status": 0
    },
    {
        "no": "SO-1010",
        "customerNo": "C0009",
        "customerName": "Matériaux Sanaga",
        "deliveryCity": "Edéa",
        "totalWeightKg": 2800,
        "status": 0
    },
    {
        "no": "SO-1011",
        "customerNo": "C0010",
        "customerName": "Librairie des Écoles",
        "deliveryCity": "Douala",
        "totalWeightKg": 260,
        "status": 0
    },
    {
        "no": "SO-1012",
        "customerNo": "C0011",
        "customerName": "Station Limbé Marine",
        "deliveryCity": "Limbé",
        "totalWeightKg": 1750,
        "status": 0
    },
    {
        "no": "SO-1013",
        "customerNo": "C0012",
        "customerName": "Clinique Bonamoussadi",
        "deliveryCity": "Douala",
        "totalWeightKg": 145.5,
        "status": 0
    },
    {
        "no": "SO-1014",
        "customerNo": "C0002",
        "customerName": "Supermarché Akwa Centre",
        "deliveryCity": "Douala",
        "totalWeightKg": 1980,
        "status": 0
    },
    {
        "no": "SO-1015",
        "customerNo": "C0003",
        "customerName": "Pharmacie du Plateau",
        "deliveryCity": "Yaoundé",
        "totalWeightKg": 310.75,
        "status": 0
    },
    {
        "no": "SO-1016",
        "customerNo": "C0013",
        "customerName": "Ferme Avicole des Hauts Plateaux",
        "deliveryCity": "Bafoussam",
        "totalWeightKg": 2250,
        "status": 0
    },
    {
        "no": "SO-1017",
        "customerNo": "C0014",
        "customerName": "Restaurant Le Wouri",
        "deliveryCity": "Douala",
        "totalWeightKg": 95,
        "status": 0
    },
    {
        "no": "SO-1018",
        "customerNo": "C0009",
        "customerName": "Matériaux Sanaga",
        "deliveryCity": "Edéa",
        "totalWeightKg": 4600,
        "status": 0
    },
    {
        "no": "SO-1019",
        "customerNo": "C0015",
        "customerName": "Grossiste Mokolo",
        "deliveryCity": "Yaoundé",
        "totalWeightKg": 3200,
        "status": 0
    },
    {
        "no": "SO-1020",
        "customerNo": "C0008",
        "customerName": "Hôtel Kribi Plage",
        "deliveryCity": "Kribi",
        "totalWeightKg": 520,
        "status": 0
    },
    {
        "no": "SO-1021",
        "customerNo": "C0016",
        "customerName": "Pêcherie de Limbé",
        "deliveryCity": "Limbé",
        "totalWeightKg": 880,
        "status": 0
    },
    {
        "no": "SO-1022",
        "customerNo": "C0004",
        "customerName": "Boulangerie La Bonne Miche",
        "deliveryCity": "Yaoundé",
        "totalWeightKg": 410,
        "status": 0
    },
    {
        "no": "SO-1023",
        "customerNo": "C0017",
        "customerName": "Briqueterie de Bonabéri",
        "deliveryCity": "Douala",
        "totalWeightKg": 6500,
        "status": 0
    },
    {
        "no": "SO-1024",
        "customerNo": "C0010",
        "customerName": "Librairie des Écoles",
        "deliveryCity": "Douala",
        "totalWeightKg": 180,
        "status": 0
    },
    {
        "no": "SO-1025",
        "customerNo": "C0006",
        "customerName": "Agro Distribution Ouest",
        "deliveryCity": "Bafoussam",
        "totalWeightKg": 1340,
        "status": 0
    },
    {
        "no": "SO-1026",
        "customerNo": "C0018",
        "customerName": "Supérette Bastos",
        "deliveryCity": "Yaoundé",
        "totalWeightKg": 225,
        "status": 0
    },
    {
        "no": "SO-1027",
        "customerNo": "C0012",
        "customerName": "Clinique Bonamoussadi",
        "deliveryCity": "Douala",
        "totalWeightKg": 60.25,
        "status": 0
    },
    {
        "no": "SO-1028",
        "customerNo": "C0019",
        "customerName": "Comptoir Maritime de Kribi",
        "deliveryCity": "Kribi",
        "totalWeightKg": 1475,
        "status": 0
    },
    {
        "no": "SO-1029",
        "customerNo": "C0005",
        "customerName": "Établissements Fotso et Fils",
        "deliveryCity": "Yaoundé",
        "totalWeightKg": 990,
        "status": 0
    },
    {
        "no": "SO-1030",
        "customerNo": "C0020",
        "customerName": "Garage Central Edéa",
        "deliveryCity": "Edéa",
        "totalWeightKg": 735,
        "status": 0
    },
    {
        "no": "SO-1031",
        "customerNo": "C0014",
        "customerName": "Restaurant Le Wouri",
        "deliveryCity": "Douala",
        "totalWeightKg": 140,
        "status": 0
    },
    {
        "no": "SO-1032",
        "customerNo": "C0011",
        "customerName": "Station Limbé Marine",
        "deliveryCity": "Limbé",
        "totalWeightKg": 2100,
        "status": 0
    },
    {
        "no": "SO-1033",
        "customerNo": "C0015",
        "customerName": "Grossiste Mokolo",
        "deliveryCity": "Yaoundé",
        "totalWeightKg": 2650,
        "status": 0
    },
    {
        "no": "SO-1034",
        "customerNo": "C0007",
        "customerName": "Café Mont Bamboutos",
        "deliveryCity": "Bafoussam",
        "totalWeightKg": 560,
        "status": 0
    },
    {
        "no": "SO-1035",
        "customerNo": "C0002",
        "customerName": "Supermarché Akwa Centre",
        "deliveryCity": "Douala",
        "totalWeightKg": 1125,
        "status": 0
    },
    {
        "no": "SO-1036",
        "customerNo": "C0013",
        "customerName": "Ferme Avicole des Hauts Plateaux",
        "deliveryCity": "Bafoussam",
        "totalWeightKg": 3800,
        "status": 0
    },
    {
        "no": "SO-1037",
        "customerNo": "C0016",
        "customerName": "Pêcherie de Limbé",
        "deliveryCity": "Limbé",
        "totalWeightKg": 330,
        "status": 0
    },
    {
        "no": "SO-1038",
        "customerNo": "C0019",
        "customerName": "Comptoir Maritime de Kribi",
        "deliveryCity": "Kribi",
        "totalWeightKg": 270,
        "status": 0
    },
    {
        "no": "SO-1039",
        "customerNo": "C0001",
        "customerName": "Quincaillerie Ndokoti",
        "deliveryCity": "Douala",
        "totalWeightKg": 1560,
        "status": 0
    },
    {
        "no": "SO-1040",
        "customerNo": "C0018",
        "customerName": "Supérette Bastos",
        "deliveryCity": "Yaoundé",
        "totalWeightKg": 85,
        "status": 0
    }
]

export function createFixtures(today: string) {
    const transports: Omit<TransportSummary, 'totalWeightKg'>[] = [
        {no: 'TO-0001', vehicleCode: 'VH-02', deliveryDate: offsetDate(today, -3), status: 2, createdBy: 'diane', validatedBy: 'eric'},
        {no: 'TO-0002', vehicleCode: 'VH-03', deliveryDate: offsetDate(today, 1), status: 1, createdBy: 'diane', validatedBy: 'eric'},
        {no: 'TO-0003', vehicleCode: 'VH-01', deliveryDate: offsetDate(today, 1), status: 0, createdBy: 'diane', validatedBy: null},
        {no: 'TO-0004', vehicleCode: 'VH-04', deliveryDate: offsetDate(today, 2), status: 0, createdBy: 'eric', validatedBy: null},
    ]
    const lines: Record<string, string[]> = {
        'TO-0001': ['SO-1001', 'SO-1002'],
        'TO-0002': ['SO-1003', 'SO-1004', 'SO-1005'],
        'TO-0003': ['SO-1006', 'SO-1007'],
        'TO-0004': [],
    }
    return structuredClone({vehicles, salesOrders, transports, lines})
}
