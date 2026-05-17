import { Injectable } from '@angular/core';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';

@Injectable({
  providedIn: 'root'
})
export class NativeSettingsService {

  constructor() { }

  async openLocationSettings() {
    return await NativeSettings.open({
      optionAndroid: AndroidSettings.Location,
      optionIOS: IOSSettings.LocationServices
    });
  }

  async openAppSettings() {
    return await NativeSettings.open({
      optionAndroid: AndroidSettings.ApplicationDetails,
      optionIOS: IOSSettings.App
    });
  }
}
