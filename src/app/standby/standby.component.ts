import { Component, OnDestroy, OnInit } from '@angular/core';

import { AppService } from '../app.service';
import { ConfigService } from '../config/config.service';
import { PSUState } from '../model';
import { EnclosureService } from '../services/enclosure/enclosure.service';
import { SystemService } from '../services/system/system.service';

@Component({
  selector: 'app-standby',
  templateUrl: './standby.component.html',
  styleUrls: ['./standby.component.scss'],
})
export class StandbyComponent implements OnInit, OnDestroy {
  public connecting = false;
  public actionsVisible = false;
  public showConnectionError = false;
  private displaySleepTimeout: ReturnType<typeof setTimeout>;
  private connectErrorTimeout: ReturnType<typeof setTimeout>;

  public constructor(
    private configService: ConfigService,
    private service: AppService,
    private enclosureService: EnclosureService,
    private systemService: SystemService,
  ) {}

  public ngOnInit(): void {
    if (this.configService.getAutomaticScreenSleep()) {
      this.displaySleepTimeout = setTimeout(this.service.turnDisplayOff.bind(this.service), 300000);
    }
  }

  public ngOnDestroy(): void {
    clearTimeout(this.displaySleepTimeout);
    clearTimeout(this.connectErrorTimeout);
    if (this.configService.getAutomaticScreenSleep()) {
      this.service.turnDisplayOn();
    }
  }

  public reconnect(): void {
    this.actionsVisible = false;
    this.connecting = true;
    if (this.configService.getAutomaticPrinterPowerOn()) {
      // enable PSU, wait 5s and reconnect
      this.enclosureService.setPSUState(PSUState.ON);
      setTimeout(this.connectPrinter.bind(this), 5000);
    } else if (true) {
      // TODO add settings to control reset behavior and pin
      // reset controller for 1s, wait 10s for init and reconnect
      const resetPin = 1
      this.enclosureService.setOutput(resetPin, true)
      setTimeout((() => {
        this.enclosureService.setOutput(resetPin, false)
        setTimeout(this.connectPrinter.bind(this), 10000);
      }).bind(this), 1000)
    } else {
      // just reconnect
      this.connectPrinter();
    }
  }

  private connectPrinter(): void {
    this.systemService.connectPrinter();
    this.connectErrorTimeout = setTimeout(() => {
      this.showConnectionError = true;
      this.connectErrorTimeout = setTimeout(() => {
        this.showConnectionError = false;
        this.connecting = false;
      }, 30000);
    }, 15000);
  }

  public toggleCustomActions(): void {
    this.actionsVisible = !this.actionsVisible;
  }
}
