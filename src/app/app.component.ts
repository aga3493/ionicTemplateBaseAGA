import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Apiservice } from './services/apiservice';
import OneSignal from 'onesignal-cordova-plugin';
import { UIService } from './services/uiservice';
import { LanguageService } from './services/language.service';



@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private platform: Platform, public api: Apiservice,
    public ui: UIService, public languageService: LanguageService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.OneSignalInit();
      this.languageService.initLanguage();
    });
  }

  // Call this function when your app starts
  async OneSignalInit(): Promise<void> {
    OneSignal.Debug.setLogLevel(0);
    OneSignal.initialize("");

    OneSignal.setConsentRequired(false);
    OneSignal.User.setLanguage(this.api.getlang() ?? 'en')


    OneSignal.User.pushSubscription.addEventListener("change", async (event) => {
      console.log("Subscription changed:", event);
      if (event.current.optedIn) {
        const fcmId = await OneSignal.User.pushSubscription.getIdAsync();
        this.api.fcm = fcmId;
        console.log("fcm from observer:", fcmId);
      } else {
        OneSignal.Notifications.requestPermission(true).then(async (accepted) => {
          if (accepted) {
            const fcmId = await OneSignal.User.pushSubscription.getIdAsync();
            this.api.fcm = fcmId;
            console.log("fcm from observer:", fcmId);
          } else {
            this.checkNotificationSubscription()
          }
        });
      }
    });

    await OneSignal.User.pushSubscription.optIn();

    const isSubscribed = OneSignal.User.pushSubscription.optedIn;
    if (isSubscribed) {
      const fcmId = await OneSignal.User.pushSubscription.getIdAsync();
      this.api.fcm = fcmId;
      console.log("fcm (already subscribed):", fcmId);
    } else {
      console.warn("User not subscribed yet. Waiting for subscription change...");
    }

    let myClickListener = async (event) => {
      console.log("notificationData", event);
      if (event.notification.additionalData.id) {
        return this.ui.navCtrl.navigateRoot("track-orders", {
          queryParams: { id: event.notification.additionalData.id },
        });
      }
    };
    OneSignal.Notifications.addEventListener("click", myClickListener);

    let myLifecyleListener = (event) => {
      console.log("Foreground Notification Event:", event);
      event.preventDefault();
      event.notification.display();
      if (event.notification.additionalData.id) {
        return this.ui.navCtrl.navigateRoot("track-orders", {
          queryParams: { id: event.notification.additionalData.id },
        });
      }
    };
    OneSignal.Notifications.addEventListener("foregroundWillDisplay", myLifecyleListener);
  }

  // ✅ New method to check subscription and prompt alert if needed
  async checkNotificationSubscription(): Promise<void> {
    const isSubscribed = OneSignal.User.pushSubscription.getOptedInAsync();

    if (!isSubscribed) {
      const alert = await this.ui.alertCtrl.create({
        header: this.api.trans('Notifications Disabled'),
        message: this.api.trans('Please allow notifications to receive order updates'),
        buttons: [
          {
            text: this.api.trans('Cancel'),
            role: 'cancel',
            cssClass: 'secondary',
          },
          {
            text: this.api.trans('Enable'),
            handler: async () => {
              const accepted = await OneSignal.Notifications.requestPermission();
              if (accepted) {
                const fcmId = await OneSignal.User.pushSubscription.getIdAsync();
                this.api.fcm = fcmId;
                console.log("User accepted notifications. fcm:", fcmId);
              } else {
                console.warn("User denied notification permission.");
              }
            }
          }
        ]
      });

      await alert.present();
    } else {
      console.log("User already subscribed for notifications.");
    }
  }
}

