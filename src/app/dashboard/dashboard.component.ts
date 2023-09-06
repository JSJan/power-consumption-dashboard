import { Component, OnInit } from '@angular/core';
import { MetersService } from '../meters.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(private metersService: MetersService) { }

  ngOnInit(): void {
    this.metersService.calculatedMeters.subscribe(metersList => {
      console.log(metersList, 'from dashboard');
    });
  }

}
