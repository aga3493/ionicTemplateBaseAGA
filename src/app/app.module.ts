import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';


// Third party imports
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      innerHTMLTemplatesEnabled: true
    }),
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot(),
  ],
  providers: [
    provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    AppVersion,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }