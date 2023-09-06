// Define a function to generate random consumption data
export const generateConsumptionData = (voltage: number, current: number, powerFactor: number) => {
    // Simulate a random electricity consumption value (in kilowatt-hours)
    return voltage * current * powerFactor
}

// Define a function to generate random voltage data
export  const generateVoltageData = () => {
    // Simulate voltage fluctuations between 220V and 240V
    const minVoltage = 244;
    const maxVoltage = 252;
    return Math.random() * (maxVoltage - minVoltage) + minVoltage;
}

// Define a function to generate random current data
export const generateCurrentData = () => {
    // Simulate current fluctuations between 5A and 10A
    const minCurrent = 0;
    const maxCurrent = 15;
    return Math.random() * (maxCurrent - minCurrent) + minCurrent;
}

// Define a function to generate random power factor data
export const generatePowerFactorData = () => {
    // Simulate power factor between 0.8 and 0.95
    const minPowerFactor = 0.8;
    const maxPowerFactor = 0.95;
    return Math.random() * (maxPowerFactor - minPowerFactor) + minPowerFactor;
}