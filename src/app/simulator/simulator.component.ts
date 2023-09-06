import { Component, OnInit } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { take, map, takeUntil } from 'rxjs/operators';
import * as SimulatorHelpers from './helper';
import { MetersService } from '../meters.service';

@Component({
  selector: 'app-simulator',
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.scss']
})
export class SimulatorComponent implements OnInit {
  metersList: any = [];
  isVoltageVariation = false;
  meterIdOfVoltageVaration;
  meterIdOfOutage;
  meterIdOfPublicLighting;
  isPublicLightingAnomaly;
  meterIdOfNoPublicLighting;
  isNoPublicLightingAnomaly;
  isOutage = false;
  allowedStopHour = 6;
  stopSimulation$: Subject<any> = new Subject();

  constructor(private metersService: MetersService) {}

  async ngOnInit() {
    this.metersList = await this.getStaticMeters();
   this.simulateMeterData();
  }

  async getStaticMeters() {
    const meterData = await fetch('./../../assets/meters.json');
    const metersResponse = await meterData.json();
    return metersResponse.map((meter: any, index: number) => {
      if (index % 10 === 0) {
        meter.connectionType = 'publicLighting';
      } else {
        meter.connectionType = 'domestic';
      }
      return {
        meterId: meter.meterId,
        connectionType: meter.connectionType,
        locationId: meter.locationId,
        timeseries: [],
      }
    }).slice(0, 50);
  }

  simulateMeterData() {
    interval(3000)
    .pipe(
      takeUntil(this.stopSimulation$),
      map(() => {
        const currentHour = new Date(Date.now()).getHours();
        this.metersList.forEach((meter: any) => {
          let voltage = 0;
          let current = 0;
          let powerFactor = 0;
          if (meter.meterId === this.meterIdOfVoltageVaration) {
            voltage = 259.46;
          } else if (meter.meterId === this.meterIdOfOutage) {
            voltage = 0;
            current = 0;
            powerFactor = 0;
          } else {
            voltage = Number(SimulatorHelpers.generateVoltageData().toFixed(2));
          }
         
          if (currentHour > this.allowedStopHour && meter.connectionType === 'publicLighting') {
            current = 0;
            powerFactor = 0;
          } else {
            current = Number(SimulatorHelpers.generateCurrentData().toFixed(2));
            powerFactor = Number(SimulatorHelpers.generatePowerFactorData().toFixed(2));
          }

          // create public lighting anomaly
          if (meter.meterId === this.meterIdOfPublicLighting && meter.connectionType === 'publicLighting') {
            current = Number(SimulatorHelpers.generateCurrentData().toFixed(2));
            powerFactor = Number(SimulatorHelpers.generatePowerFactorData().toFixed(2));
          }

          // create no public lighting anomaly
          if (meter.meterId === this.meterIdOfNoPublicLighting && meter.connectionType === 'publicLighting') {
            current = 0;
            powerFactor = 0;
          }
          
          const consumption = Number(SimulatorHelpers.generateConsumptionData(voltage, current, powerFactor).toFixed(2));
          const reading = {
            timestamp: new Date(),
            voltage,
            current,
            powerFactor,
            consumption
          };
          meter.timeseries = [...meter.timeseries, reading];
        })
      })
    )
    .subscribe(() => {
      this.metersService.metersTimeseries.next(this.metersList);
    });
  }

  simulateVoltageVariation (meterId) {
    this.isVoltageVariation = !this.isVoltageVariation;
    if (this.isVoltageVariation) {
      this.meterIdOfVoltageVaration = meterId;
    } else {
      this.meterIdOfVoltageVaration = '';
    }
  }

  simulateOutage (meterId) {
    this.isOutage = !this.isOutage;
    if (this.isOutage) {
      this.meterIdOfOutage = meterId;
    } else {
      this.meterIdOfOutage = '';
    }
  }

  simulatePublicLighting (meterId) {
    this.isPublicLightingAnomaly = !this.isPublicLightingAnomaly;
    if (this.isPublicLightingAnomaly) {
      this.meterIdOfPublicLighting = meterId;
    } else {
      this.meterIdOfPublicLighting = '';
    }
  }

  simulateNoPublicLighting (meterId) {
    this.isNoPublicLightingAnomaly = !this.isNoPublicLightingAnomaly;
    if (this.isNoPublicLightingAnomaly) {
      this.meterIdOfNoPublicLighting = meterId;
    } else {
      this.meterIdOfNoPublicLighting = '';
    }
  }

  

  stop() {
    this.stopSimulation$.next(true);
  }
}
