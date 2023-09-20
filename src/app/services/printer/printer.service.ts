import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PrinterProfile } from '../../model';

@Injectable()
export abstract class PrinterService {
  abstract getActiveProfile(): Observable<PrinterProfile>;

  abstract saveSettings(): void;

  abstract executeGCode(gCode: string): void;

  abstract jog(x: number, y: number, z: number): void;

  abstract extrude(amount: number, speed: number): void;

  abstract setTemperatureHotend(temperature: number, targetInfo?: string): void;

  abstract setTemperatureBed(temperature: number): void;

  abstract setFanSpeed(percentage: number): void;

  abstract setFeedrate(feedrate: number): void;

  abstract setFlowrate(flowrate: number): void;

  abstract disconnectPrinter(): void;

  abstract emergencyStop(): void;

  abstract setZOffset(offset: number): void;
}
