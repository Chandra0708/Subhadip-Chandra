export enum HeatingType {
    GAS = 'Natural Gas',
    OIL = 'Heating Oil',
    ELECTRIC = 'Electric',
    BIOMASS = 'Biomass'
}

export enum VehicleType {
    CAR = 'Car',
    CARPOOL = 'Carpool',
    MOTORCYCLE = 'Motorcycle',
    BUS = 'Bus',
    TRAIN = 'Train',
    CYCLING = 'Cycling',
    WALKING = 'Walking',
}

export enum FuelType {
    PETROL = 'Petrol',
    DIESEL = 'Diesel',
    ELECTRIC = 'Electric',
    CNG = 'CNG',
    HYBRID = 'Hybrid'
}

export interface User {
    name: string;
    email: string;
}

export interface FormState {
    electricity: string;
    heating: {
        type: HeatingType;
        value: string;
    };
    transport: {
        vehicleType: VehicleType;
        fuelType: FuelType | string;
        distance: string;
    };
    diet: {
        redMeat: string;
        poultry: string;
        fish: string;
        dairy: string;
        plantBased: string;
    };
    spending: {
        clothing: string;
        electronics: string;
        furniture: string;
        entertainment: string;
        other: string;
    };
    waste: string;
}

export interface EmissionBreakdown {
    name: string;
    value: number;
}

export interface EmissionResults {
    breakdown: EmissionBreakdown[];
    totalMonthly: number;
    totalAnnual: number;
    treesToPlant: number;
}