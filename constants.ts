import { VehicleType, FuelType, HeatingType } from './types';

// Emission factors for INDIA (in kg CO2e per unit)
export const EMISSION_FACTORS = {
    // kg CO2e per kWh
    electricity: 0.71, 
    
    heating: {
        [HeatingType.GAS]: 2.75,       // kg CO2e per kg
        [HeatingType.OIL]: 2.6,        // kg CO2e per liter
        [HeatingType.ELECTRIC]: 0.71,  // kg CO2e per kWh (same as electricity)
        [HeatingType.BIOMASS]: 0.1,    // kg CO2e per kg
    },

    // kg CO2e per km
    transport: {
        [VehicleType.CAR]: {
            [FuelType.PETROL]: 0.155,
            [FuelType.DIESEL]: 0.165,
            [FuelType.ELECTRIC]: 0.05,
            [FuelType.CNG]: 0.130,
            [FuelType.HYBRID]: 0.110
        },
        [VehicleType.CARPOOL]: { // Assuming average occupancy of 2.5
            [FuelType.PETROL]: 0.155 / 2.5,
            [FuelType.DIESEL]: 0.165 / 2.5,
            [FuelType.ELECTRIC]: 0.05 / 2.5,
            [FuelType.CNG]: 0.130 / 2.5,
            [FuelType.HYBRID]: 0.110 / 2.5
        },
        [VehicleType.MOTORCYCLE]: {
             [FuelType.PETROL]: 0.09
        },
        [VehicleType.BUS]: 0.03, // per passenger-km
        [VehicleType.TRAIN]: 0.015, // per passenger-km
        [VehicleType.CYCLING]: 0,
        [VehicleType.WALKING]: 0,
    },
    
    // kg CO2e per weekly serving per month
    diet: {
        redMeat: 16.3, // Mutton/Goat
        poultry: 3.25,
        fish: 2.6,
        dairy: 2.17,
        plantBased: 1.08,
    },
    
    // kg CO2e per ₹100 spent
    spending: {
        clothing: 0.6,
        electronics: 0.48,
        furniture: 0.36,
        entertainment: 0.24,
        other: 0.3,
    },
    
    // kg CO2e per kg of waste
    waste: 0.19,
    
    // kg CO2e absorbed by one tree per year
    treeSequestration: 21, 
};

export const TRANSPORT_OPTIONS = {
    [VehicleType.CAR]: {
        fuels: [FuelType.PETROL, FuelType.DIESEL, FuelType.ELECTRIC, FuelType.CNG, FuelType.HYBRID]
    },
    [VehicleType.CARPOOL]: {
        fuels: [FuelType.PETROL, FuelType.DIESEL, FuelType.ELECTRIC, FuelType.CNG, FuelType.HYBRID]
    },
    [VehicleType.MOTORCYCLE]: {
        fuels: [FuelType.PETROL]
    },
    [VehicleType.BUS]: {
        fuels: []
    },
    [VehicleType.TRAIN]: {
        fuels: []
    },
    [VehicleType.CYCLING]: {
        fuels: []
    },
    [VehicleType.WALKING]: {
        fuels: []
    }
}