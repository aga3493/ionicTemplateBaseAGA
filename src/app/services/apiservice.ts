import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController, AlertInput, LoadingController, MenuController, ModalController, NavController, Platform, ToastController } from '@ionic/angular';
import OneSignal from 'onesignal-cordova-plugin';
import * as moment from 'moment';
import 'moment-timezone';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class Apiservice {
  uid: any = null;
  fcm: any = null;
  user: any = null;
  uiid: any = null;

  constructor(public l: LoadingController, public nav: NavController, public t: ToastController,
    public r: Router, public a: AlertController, public menu: MenuController, public translate: TranslateService,
    public m: ModalController, public http: HttpClient, public active: ActivatedRoute, public p: Platform,
    public actionSheet: ActionSheetController, public appVersion: AppVersion) {
  }


  trans(key: string): string {
    if (!key) return '';
    return this.translate.instant(key);
  }

  public getCurrency(): string {
    try {
      const countryData = localStorage.getItem('country');
      if (countryData) {
        const country = JSON.parse(countryData);
        return country.currency || '';
      }
      return '';
    } catch (error) {
      console.error('Error parsing country currency:', error);
      return '';
    }
  }

  public formatCurrency(value: any): string {
    const currencyCode = this.getCurrency();
    const num = Number(value);
    if (value === null || value === undefined || isNaN(num)) {
      return `0.00 ${currencyCode}`;
    }
    try {
      const formatterOptions = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode || 'USD'
      }).resolvedOptions();
      const fractionDigits = formatterOptions.maximumFractionDigits ?? 2;
      return `${num.toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
      })} ${currencyCode}`;
    } catch {
      return `${num.toFixed(2)} ${currencyCode}`;
    }
  }

  getlang(): string {
    return localStorage.getItem('appLang') || 'en';
  }

  public km(distance: any): number {
    return Number((Number(distance) / 1000).toFixed(2));
  }

  async getuuid(): Promise<string> {
    const info = await Device.getId();
    return this.uiid = info.identifier;
  }

  logout() {

  }

  async getFcmToken() {
    if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
      const res = await OneSignal.User.pushSubscription.getIdAsync()
      return this.fcm = res;
    }
  }

  // Generate random number according to lenght
  generateRandomNumber(length: number): string {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  truncateText(text: string, limit: number = 10): string {
    return text.length > limit ? text.slice(0, limit) + '..' : text;
  }

  async updateAppAndroid() {
    const alert = await this.a.create({
      cssClass: 'alert-rtl',
      message: 'يوجد تحديث جديد للتطبيق يرجى تحديث التطبيق الان ',
      backdropDismiss: false,
      buttons: [
        {
          text: 'تحديث',
          handler: () => {
            if (this.p.is('android')) {
              location.assign('')
            } else {

            }
            return false;
          }
        }
      ]
    });
    await alert.present();
  }


  // convert arabic number to english number
  ConvertArbicNumberToEnglish(num) {
    var arabicMap = {
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9'
    };
    var arabic = num;
    var english = '';
    for (var i = 0; i < arabic.length; i++) {
      var arabicChar = arabic[i];
      var englishChar = arabicMap[arabicChar];
      english += englishChar;
    }
    return english;
  }

  // check if first number is zero
  isFirstNumberZero(num) {
    if (num.charAt(0) == '0') {
      return true;
    } else {
      return false;
    }
  }

  // Remove First Number If Zero
  RemoveFirstNumberIfZero(num) {
    if (num.charAt(0) == '0') {
      return num.substring(1);
    } else {
      return num;
    }
  }

  // check if numbers are Arabic or English
  isArabic(num) {
    var arabic = /^[\u0600-\u06FF\s]*$/;
    if (num.match(arabic)) {
      return true;
    } else {
      return false;
    }
  }


  opreationconvertNumber(phone) {
    let p
    if (this.isArabic(phone)) {
      let convertNumber = this.ConvertArbicNumberToEnglish(phone);
      if (this.isFirstNumberZero(convertNumber)) {
        p = this.RemoveFirstNumberIfZero(convertNumber);
        console.log(p)
      } else {
        p = convertNumber;
      }
    } else {
      if (this.isFirstNumberZero(phone)) {
        p = this.RemoveFirstNumberIfZero(phone);
        console.log(p)
      } else {
        p = phone;
      }
    }
    return p
  }

  convertNumberIfArabic(phone) {
    let p
    if (this.isArabic(phone)) {
      let convertNumber = this.ConvertArbicNumberToEnglish(phone);
      p = convertNumber;
    } else {
      p = phone;
    }
    return p
  }


  sendNotifiToCustomers(title_en, msg_en, fcmTokens, order_key) {
    const tokens = Array.isArray(fcmTokens) ? fcmTokens : [fcmTokens];

    const body = {
      app_id: '',
      include_subscription_ids: tokens,
      headings: {
        en: title_en,
        ar: title_en,
      },
      contents: {
        en: msg_en,
        ar: msg_en,
      },
      data: { id: order_key },
      //android_channel_id: 'babfbb52-40e7-4b05-8ad8-3b428c30b0ce'
    };

    const header = {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Basic ')
    };

    return this.http.post('https://api.onesignal.com/notifications', body, header).subscribe(
      res => {
        console.log("✅ Notification sent:", res);
      },
      err => {
        console.error('❌ Notification error:', err.error || err.message || err);
      }
    );
  }

}
