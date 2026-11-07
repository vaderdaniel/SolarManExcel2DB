import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SystemStatusService } from '../../services/system-status.service';

/** System status strip on the Home page; data comes from the app-wide SystemStatusService poll. */
@Component({
  selector: 'app-status-panel',
  imports: [DatePipe],
  templateUrl: './status-panel.html',
  styleUrl: './status-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusPanelComponent {
  protected readonly systemStatus = inject(SystemStatusService);
}
