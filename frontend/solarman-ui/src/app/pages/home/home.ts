import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EnergySummaryComponent } from '../../components/energy-summary/energy-summary';
import { ProductionChartComponent } from '../../components/production-chart/production-chart';
import { TshwaneChartComponent } from '../../components/tshwane-chart/tshwane-chart';
import { StatusPanelComponent } from '../../components/status-panel/status-panel';
import { SystemStatusService } from '../../services/system-status.service';

@Component({
  selector: 'app-home',
  imports: [
    DatePipe,
    RouterLink,
    EnergySummaryComponent,
    ProductionChartComponent,
    TshwaneChartComponent,
    StatusPanelComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  protected readonly systemStatus = inject(SystemStatusService);
  protected readonly today = new Date();
}
