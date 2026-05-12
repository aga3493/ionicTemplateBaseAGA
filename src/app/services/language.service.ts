import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  constructor(private translate: TranslateService, public alertController: AlertController) { }

  initLanguage() {
    const savedLang = localStorage.getItem('appLang')
    if (savedLang) {
      this.setLanguage(savedLang);
    } else {
      this.selectLanguage();
    }
  }

  setLanguage(lang: string) {
    console.log(lang)
    this.translate.use(lang);
    localStorage.setItem('appLang', lang);
    if (lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    }
  }

  getCurrentLanguage(): string {
    return this.translate.currentLang || 'en';
  }

  async selectLanguage() {
    const alert = await this.alertController.create({
      backdropDismiss: false,
      header: this.translate.instant('Select Language'),
      inputs: [
        {
          name: 'language',
          type: 'radio',
          label: this.translate.instant('English'),
          value: 'en',
          checked: this.getCurrentLanguage() === 'en'
        },
        {
          name: 'language',
          type: 'radio',
          label: this.translate.instant('Arabic'),
          value: 'ar',
          checked: this.getCurrentLanguage() === 'ar'
        }
      ],
      buttons: [
        {
          text: this.translate.instant('select'),
          handler: (data) => {
            console.log(data)
            this.setLanguage(data);
          }
        }
      ]
    });
    await alert.present();
  }
}
