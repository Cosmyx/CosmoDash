import { Component, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';

import { ConfigService } from '../config/config.service';
import { PrinterState, PrinterStatus, TemperatureReading } from '../model';
import { NotificationService } from '../notification/notification.service';
import { EnclosureService } from '../services/enclosure/enclosure.service';
import { SocketService } from '../services/socket/socket.service';
import { PrinterService } from '../services/printer/printer.service';

@Component({
  selector: 'app-bottom-bar',
  templateUrl: './bottom-bar.component.html',
  styleUrls: ['./bottom-bar.component.scss'],
})
export class BottomBarComponent implements OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private printerReady = false;

  public printerStatus: PrinterState;
  public enclosureTemperature: number;
  public enclosureTemperatureTarget: number;
  public enclosureTemperatureUnit: string;
  public enclosureTemperatureControl: boolean = false;

  public constructor(
    private socketService: SocketService,
    private configService: ConfigService,
    private enclosureService: EnclosureService,
    private notificationService: NotificationService,
    private printerService: PrinterService,
  ) {
    if (this.configService.getAmbientTemperatureSensorName() !== null) {
      this.subscriptions.add(
        timer(2500, 15000).subscribe(() => {
          if (this.printerReady) {
            this.enclosureService.getEnclosureTemperature().subscribe(
              (temperatureReading: TemperatureReading) => {
                this.enclosureTemperature = temperatureReading.temperature;
                this.enclosureTemperatureUnit = temperatureReading.unit;
              },
              error => {
                this.notificationService.setError(
                  $localize`:@@error-enclosure-temp:Can't retrieve enclosure temperature!`,
                  error.message,
                );
              },
            );
          }
        }),
      );
    } else {
      this.subscriptions.add(
        this.socketService.getPrinterStatusSubscribable().subscribe((printerStatus: PrinterStatus): void => {
          if (printerStatus.chamber?.current > 0) {
            const chamberReading: TemperatureReading = {
              temperature: printerStatus.chamber.current,
              humidity: 0,
              unit: printerStatus.chamber.unit,
            };
            this.enclosureTemperature = chamberReading.temperature;
            this.enclosureTemperatureUnit = chamberReading.unit;
          }
        }),
      );
    }
    this.subscriptions.add(
      this.socketService.getPrinterStatusSubscribable().subscribe((printerStatus: PrinterStatus): void => {
        this.printerStatus = printerStatus.status;
        if (!this.printerReady) {
          this.printerReady = [PrinterState.operational, PrinterState.printing, PrinterState.paused].includes(
            this.printerStatus,
          );
        }
      }),
    );
  }

  public getStringStatus(printerState: PrinterState): string {
    return PrinterState[printerState];
  }

  public getPrinterName(): string {
    return this.configService.getPrinterName();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public getEnclosureTemperature(): string {
    return this.enclosureTemperature.toFixed(0);
  }

  private changeValue(item: string, value: number): void {
    this[item] = Math.round((this[item] + value) * 100) / 100;
    if (this[item] <= -999) {
      this.enclosureTemperatureTarget = this.enclosureTemperature;
    }
  }

  public showQuickControl(): void {
    this.enclosureTemperatureTarget = this.enclosureTemperature;
    this.enclosureTemperatureControl = true;
    setTimeout((): void => {
      const controlViewDOM = document.getElementById('quickControl');
      controlViewDOM.style.opacity = '1';
    }, 50);
  }

  public hideQuickControl(): void {
    const controlViewDOM = document.getElementById('quickControl');
    controlViewDOM.style.opacity = '0';
    setTimeout((): void => {
      this.enclosureTemperatureControl = false;
    }, 500);
  }

  public quickControlSettings() {
    return {
      image: 'heat.svg',
      target: this.enclosureTemperatureTarget,
      unit: '°C',
      smallStep: 1,
      bigStep: 10,
      reset: -999,
      changeValue: (value: number) => this.changeValue('enclosureTemperatureTarget', Number(value)),
      setValue: () => {
        this.printerService.executeGCode(`${this.configService.getEnclosureTemperatureGCode()}${this.getEnclosureTemperature()};`);
        this.hideQuickControl();
      },
    }
  }
}
