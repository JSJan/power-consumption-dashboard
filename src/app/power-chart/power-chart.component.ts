import { Component, OnInit } from '@angular/core';
import * as echarts from 'echarts';

@Component({
  selector: 'app-power-chart',
  templateUrl: './power-chart.component.html',
  styleUrls: ['./power-chart.component.scss']
})
export class PowerChartComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Initialize the chart container
    const chartContainer = document.getElementById('chart-container');
    const chart = echarts.init(chartContainer);

    // Example data for the chart
    const data = {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      values: [120, 150, 180, 200, 160]
    };

    // Chart configuration
    const option = {
      xAxis: {
        type: 'category',
        data: data.categories
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: data.values,
        type: 'bar'
      }]
    };

    // Set chart options and render
    chart.setOption(option);
  }

}