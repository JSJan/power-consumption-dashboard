import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import Locations from '../assets/locations.json'

@Injectable({
  providedIn: 'root'
})
export class MetersService {
  calculatedMeters: Subject<any> = new Subject();
  metersTimeseries: Subject<any> = new Subject();
  allowedStopHour = 6;
  allowedStartHour = 18;
  locations: any[] = [];
  constructor() {
    //this.locations = await fetch('./../../assets/locations.json');
    this.metersTimeseries.subscribe(metersList => {
      const caluculatedMeters = this.calculator(metersList);
      console.log(caluculatedMeters, 'calculated meters');
    })
  }

  calculator (metersList: any[]) {
    metersList.forEach(meter => {
        meter.anomalies = [];
        meter.powerFactor = {
          min: [],
          max: [],
          avg: [],
        };
        meter.demand = {
          min: [],
          max: [],
          avg: [],
          zero: [],
        }
        meter.outages = []
        // power factor block //
        const minPf = meter.timeseries.reduce((prev: any, curr: any) => prev.powerFactor < curr.powerFactor ? prev : curr);
        const maxPf = meter.timeseries.reduce((prev: any, curr: any) => prev.powerFactor > curr.powerFactor ? prev : curr);
        let sumOfPf = 0;
        meter.timeseries.forEach((value: any) => {
          sumOfPf += value.powerFactor;
        });
        const avgPf = Number((sumOfPf/meter.timeseries.length).toFixed(2));
        meter.powerFactor.avg.push({timestamp: '', value: avgPf});
        // power factor block //
        
        // demand profile
        const minDemand = meter.timeseries.reduce((prev: any, curr: any) => prev.consumption < curr.consumption ? prev : curr);
        const maxDemand = meter.timeseries.reduce((prev: any, curr: any) => prev.consumption > curr.consumption ? prev : curr);
        let sumOfConsumption = 0;
        meter.timeseries.forEach((value: any) => {
          sumOfConsumption += value.consumption;
        });
        const avgConsumption = Number((sumOfConsumption/meter.timeseries.length).toFixed(2));
        meter.demand.avg.push({timestamp: '', value: avgConsumption});
        // demand profile


        const repairContact = Locations.find(x => x.locationId === meter.locationId) ?? this.locations[0]
        meter.timeseries.forEach((parameters: any) => {
            // anomalies block //
            const isAnomalyFound = this.isAnomaly(3,3,250, parameters.voltage);
            if (isAnomalyFound) {
                meter.anomalies.push({ type: 'voltageVariation', meterId: meter.meterId, timestamp: parameters.timestamp, value: parameters.voltage, repairContact });
            }

            if (meter.connectionType === 'publicLighting') {
              const currentHour = new Date(Date.now()).getHours();
              // 9 >= 6
              if (currentHour >= this.allowedStopHour && parameters.consumption > 0) {
                meter.anomalies.push({ type: 'invalidPublicLighting', meterId: meter.meterId, timestamp: parameters.timestamp });
              }

              /* if (currentHour <= this.allowedStartHour && parameters.consumption === 0) {
                meter.anomalies.push({ type: 'noPublicLighting', meterId: meter.meterId, timestamp: parameters.timestamp });
              } */
            }
            // anomalies block //

            // power factor block //
            if (parameters.powerFactor === minPf.powerFactor) {
                meter.powerFactor.min.push({ timestamp: parameters.timestamp, value: minPf.powerFactor });
            } else if (parameters.powerFactor === maxPf.powerFactor) {
                meter.powerFactor.max.push({ timestamp: parameters.timestamp, value: maxPf.powerFactor });
            }
            // power factor block //

            // demand profile
            if (parameters.consumption === minDemand.consumption && minDemand.consumption > 0) {
              meter.demand.min.push({ timestamp: parameters.timestamp, value: minDemand.consumption });
            } else if (parameters.consumption === maxDemand.consumption) {
                meter.demand.max.push({ timestamp: parameters.timestamp, value: maxDemand.consumption });
            } else if (parameters.consumption === 0) {
              meter.demand.zero.push({ timestamp: parameters.timestamp, value: 0});
            }
            // demand profile
        });
      
        meter.outages = this.detectOutages(meter)
        
        

    });
    
    return metersList;
}


  isAnomaly (upperThreshold: number, lowerThreshold: number, baseValue: number, actualValue: number) {
      const allowedLowerValue = baseValue - (baseValue * lowerThreshold/100);
      const allowedUpperValue = baseValue + (baseValue * upperThreshold/100);
      if ((actualValue < allowedLowerValue || actualValue > allowedUpperValue) && actualValue > 0) {
          return true;
      }
      return false;
  }

  demandProfile (meter) {
    const min = meter.timeseries.reduce((prev: any, curr: any) => prev.consumption < curr.consumption ? prev : curr);
    const max = meter.timeseries.reduce((prev: any, curr: any) => prev.consumption > curr.consumption ? prev : curr);
    let sumOfConsumption = 0;
    meter.timeseries.forEach((value: any) => {
      sumOfConsumption += value.powerFactor;
    });
    const avgConsumption = sumOfConsumption/meter.timeseries.length;
    meter.demand.avg.push({timestamp: '', value: avgConsumption});
  }
  
detectOutages (meter, threshold = 0) {
  const amiData = meter.timeseries
  const outages : any[] = [];
  let outageStart = null;
  const repairContact = Locations.find(x => x.locationId === meter.locationId) ?? this.locations[0]
  for (let i = 0; i < amiData.length; i++) {
    const currentValue = amiData[i].voltage;
    let outage;
    if (Math.floor(currentValue) === 0) {
      // Detected a potential outage
      if (!outageStart) {
        outageStart = amiData[i].timestamp;
        outages.push({ start: outageStart, repairContact})
      }
    } else if (outageStart !== null) {
      // Power has been restored
      const outageEnd = amiData[i - 1].timestamp;
      const duration = (outageEnd - outageStart) / (1000 * 60); // Duration in minutes

     
      if (duration >= threshold) {  //Can Notify the location contact based on location id using Location API client side
        outages.push({ start: outageStart, end: outageEnd, duration, location});
      }

      outageStart = null;
    }
  }

  return outages;
};

}
