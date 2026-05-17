import { Injectable, inject } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { App } from '@capacitor/app';
import { Apiservice } from './apiservice';
import { AlertController } from '@ionic/angular';
import { NativeSettingsService } from './native-settings.service';
import { UIService } from './uiservice';

@Injectable({
  providedIn: 'root',
})
export class GeoLocation {
  private nativeSettings = inject(NativeSettingsService);
  private ui = inject(UIService);
  private api = inject(Apiservice);
  private alertCtrl = inject(AlertController);

  private isChecking = false;

  constructor() {
    this.initAppListener();
  }

  private initAppListener() {
    App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        // Automatically check when coming back to app
        this.checkPermissionsAndLocation();
      }
    });
  }

  public async checkPermissionsAndLocation(): Promise<Position | null> {
    if (this.isChecking) return null;
    this.isChecking = true;

    try {
      // 1. Check Permissions
      let permStatus = await Geolocation.checkPermissions();
      if (permStatus.location === 'prompt' || permStatus.location === 'prompt-with-rationale') {
        permStatus = await Geolocation.requestPermissions();
      }

      if (permStatus.location === 'denied') {
        await this.promptAppSettings();
        this.isChecking = false;
        return null;
      }

      // 2. Try getting position. If it fails, GPS is likely off.
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 120000000,

        });
        this.isChecking = false;
        return position;
      } catch (err: any) {
        console.error('Error getting position', err);
        // Typical error when GPS is off
        await this.promptLocationSettings();
        this.isChecking = false;
        return null;
      }

    } catch (e) {
      console.error('Geolocation setup error', e);
      this.isChecking = false;
      return null;
    }
  }

  private async promptAppSettings() {
    const alert = await this.alertCtrl.create({
      header: this.api.trans('Permission Denied'),
      message: this.api.trans('Please enable location permission in App Settings.'),
      buttons: [
        {
          text: this.api.trans('Cancel'),
          role: 'cancel'
        },
        {
          text: this.api.trans('Open Settings'),
          handler: () => {
            this.nativeSettings.openAppSettings();
          }
        }
      ]
    });
    await alert.present();
  }

  private async promptLocationSettings() {
    const alert = await this.alertCtrl.create({
      header: this.api.trans('Location Disabled'),
      message: this.api.trans('Please turn on GPS / Location Services.'),
      buttons: [
        {
          text: this.api.trans('Cancel'),
          role: 'cancel'
        },
        {
          text: this.api.trans('Turn On'),
          handler: () => {
            this.nativeSettings.openLocationSettings();
          }
        }
      ]
    });
    await alert.present();
  }
}
