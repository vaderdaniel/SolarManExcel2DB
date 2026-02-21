import { Component } from '@angular/core';

import { ProductionChartComponent } from '../../components/production-chart/production-chart';
import { StatusPanelComponent } from '../../components/status-panel/status-panel';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ProductionChartComponent,
    StatusPanelComponent
],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
}
