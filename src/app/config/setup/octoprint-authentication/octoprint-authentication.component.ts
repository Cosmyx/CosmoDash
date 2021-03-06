import { HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { interval } from 'rxjs';

import { TokenSuccess } from '../../../model/octoprint/auth.model';
import { NotificationService } from '../../../notification/notification.service';
import { OctoprintAuthenticationService } from './octoprint-authentication.service';

@Component({
  selector: 'app-config-setup-octoprint-authentication',
  templateUrl: './octoprint-authentication.component.html',
  styleUrls: ['./octoprint-authentication.component.scss', '../setup.component.scss'],
})
export class OctoprintAuthenticationComponent {
  @Input() octoprintURL: string;
  @Input() accessToken: string;

  @Output() increasePage = new EventEmitter<void>();
  @Output() accessTokenChange = new EventEmitter<string>();

  constructor(private authService: OctoprintAuthenticationService, private notificationService: NotificationService) {}

  public loginWithOctoprintUI(): void {
    this.authService.probeAuthSupport(this.octoprintURL).subscribe(
      result => {
        if (result.status === 204) {
          this.sendLoginRequest();
        } else this.setAutologinWarning();
      },
      error => {
        if (error.status === 0) {
          this.notificationService.setError(
            $localize`:@@octoprint-connection-failed:Can't connect to OctoPrint!`,
            $localize`:@@octoprint-connection-failed-message:Check the URL/IP and make sure that your OctoPrint instance is reachable from this device.`,
          );
        } else this.setAutologinWarning();
      },
    );
  }

  private setAutologinWarning(): void {
    this.notificationService.setWarning(
      $localize`:@@unsupported-autologin:Automatic login not supported!`,
      $localize`:@@manually-create-api-key:Please create the API Key manually and paste it in the bottom field.`,
    );
  }

  private sendLoginRequest(): void {
    this.authService.startAuthProcess(this.octoprintURL).subscribe(
      token => {
        this.notificationService.setInfo(
          $localize`:@@login-request-sent:Login request send!`,
          $localize`:@@login-request-sent-message:Please confirm the request via the popup in the OctoPrint WebUI.`,
        );
        this.pollResult(token);
      },
      _ => {
        this.setAutologinWarning();
      },
    );
  }

  private pollResult(token: string): void {
    setTimeout(() => {
      this.notificationService.closeNotification();
    }, 2000);
    const pollInterval = interval(1000).subscribe(() => {
      this.authService.pollAuthProcessStatus(this.octoprintURL, token).subscribe(
        result => {
          if (result.status === 200) {
            pollInterval.unsubscribe();
            const resultSuccess = result as HttpResponse<TokenSuccess>;
            this.accessToken = resultSuccess.body.api_key;
            this.accessTokenChange.emit(resultSuccess.body.api_key);
            setTimeout(() => {
              this.increasePage.emit();
            }, 600);
          }
        },
        _ => {
          this.setAutologinWarning();
          pollInterval.unsubscribe();
        },
      );
    });
  }
}
