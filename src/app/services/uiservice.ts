import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController, NavController, LoadingController } from '@ionic/angular';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class UIService {
  public alertCtrl = inject(AlertController);
  public toastCtrl = inject(ToastController);
  public navCtrl = inject(NavController);
  public loadingCtrl = inject(LoadingController);
  public translate = inject(TranslateService);

  // --- Public Ionic Alerts & Toasts ---
  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  async showToast(message: string, pos: "bottom" | "top" | "middle" = "bottom", color = 'primary', duration = 2000) {
    const toast = await this.toastCtrl.create({ message, duration, position: pos, color });
    await toast.present();
  }

  // --- Navigation Control ---
  goTo(path: string) {
    this.navCtrl.navigateForward(path);
  }

  // --- SweetAlert Integration ---
  showSuccess(title: string, text: string) {
    Swal.fire({ title, text, icon: 'success', heightAuto: false });
  }

  // --- Date & Time Utilities (Moment.js) ---

  formatDate(date: any, format = 'YYYY-MM-DD') {
    const m = moment(date);
    // .isValid() catches both empty values and unparseable data
    if (!date || !m.isValid()) return 'N/A';
    return m.format(format);
  }

  getTimeAgo(date: any) {
    const m = moment(date);
    if (!date || !m.isValid()) return 'N/A';
    return m.fromNow();
  }

  timedate(date: any) {
    const m = moment(date);
    if (!date || !m.isValid()) return 'N/A';
    return m.format('h:mm a');
  }

  async loading(message: string = this.translate.instant('loading')) {
    return await this.loadingCtrl.create({
      message: message,
    })
      .then(a => {
        a.present();
        return a;
      });
  }

  async dismiss() {
    const loading = await this.loadingCtrl.getTop();
    if (loading) {
      loading.dismiss();
    }
  }
}
