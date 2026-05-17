import { Component, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { Apiservice } from 'src/app/services/apiservice';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { GeoLocation } from 'src/app/services/geo-location';
import { UIService } from 'src/app/services/uiservice';

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
  standalone: false
})
export class MapModalComponent implements AfterViewInit {
  @Input() title: string = 'Select Location';
  @Input() initialLat?: number;
  @Input() initialLng?: number;

  public map: L.Map | undefined;
  public mapCenter: L.LatLng | undefined;
  public selectedAddress: string = '';

  // Search
  public searchQuery: string = '';
  public searchResults: NominatimResult[] = [];
  public isSearching: boolean = false;
  public showResults: boolean = false;

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  // GPS loading state
  public isLocating: boolean = false;

  constructor(public api: Apiservice, private modalCtrl: ModalController, private http: HttpClient, public geo: GeoLocation
    , public ui: UIService) { }

  async ngAfterViewInit() {
    await this.initMap();
    this.setupSearchListener();
    this.geo.checkPermissionsAndLocation().then(res => {
      this.api.lat = res.coords.latitude
      this.api.lng = res.coords.longitude
    })
  }

  async ionWillEnter() {
  }

  ionViewWillLeave() {
    if (this.map) {
      this.map.remove();
    }
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }

  // ─── Map Initialization ───────────────────────────────────────────────────

  private async initMap() {
    let lat = 21.4735;
    let lng = 55.9754;

    this.mapCenter = L.latLng(lat, lng);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Geolocation timeout')), 5000)
    );

    try {
      const res: any = await Promise.race([
        this.geo.checkPermissionsAndLocation(),
        timeoutPromise
      ]);
      this.api.lat = res.coords.latitude;
      this.api.lng = res.coords.longitude;
      this.mapCenter = L.latLng(res.coords.latitude, res.coords.longitude);
    } catch (error) {
      console.warn('Geolocation delayed or failed, using default coordinates', error);
    }

    this.map = L.map('leaflet-map', {
      center: this.mapCenter,
      zoom: 12,
      zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 300);
    this.map.on('move', () => {
      this.mapCenter = this.map!.getCenter();
      this.selectedAddress = '';
    });

    this.map.on('moveend', () => {
      this.mapCenter = this.map!.getCenter();
      // check if zoom is 18 or more
      this.fetchAddress(this.mapCenter.lat, this.mapCenter.lng);

    });

  }

  // ─── Reverse Geocoding ────────────────────────────────────────────────────

  private fetchAddress(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res && res.display_name) {
          const parts = res.display_name.split(',');
          this.selectedAddress = parts.slice(0, 3).join(', ');
        }
      },
      error: (err) => {
        console.error('Reverse Geocoding failed', err);
      }
    });
  }

  // ─── Address Search Autocomplete ──────────────────────────────────────────

  private setupSearchListener() {
    this.searchSub = this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.trim().length < 3) {
            this.searchResults = [];
            this.isSearching = false;
            return of([]);
          }
          this.isSearching = true;

          // Added &countrycodes=om to restrict results to Oman
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1&countrycodes=om`;

          return this.http.get<NominatimResult[]>(url);
        })
      )
      .subscribe({
        next: (results) => {
          this.searchResults = results as NominatimResult[];
          this.isSearching = false;
          this.showResults = this.searchResults.length > 0;
        },
        error: () => {
          this.isSearching = false;
          this.searchResults = [];
        }
      });
  }
  onSearchInput(event: any) {
    const query = event.target?.value ?? event;
    this.searchQuery = query;
    this.showResults = false;
    this.searchSubject.next(query);
  }

  selectResult(result: NominatimResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    this.searchQuery = result.display_name.split(',').slice(0, 3).join(', ');
    this.selectedAddress = this.searchQuery;
    this.showResults = false;
    this.searchResults = [];
    this.map?.setView([lat, lng], 16);
  }

  closeResults() {
    setTimeout(() => {
      this.showResults = false;
    }, 200);
  }

  // ─── Current Location ─────────────────────────────────────────────────────

  async goToCurrentLocation() {
    if (this.isLocating) return;
    this.isLocating = true;
    try {
      await this.geo.checkPermissionsAndLocation().then(res => {
        this.api.lat = res.coords.latitude;
        this.api.lng = res.coords.longitude;
        this.map?.setView([this.api.lat, this.api.lng], 17);
        this.fetchAddress(this.api.lat, this.api.lng);
      })

    } catch (e) {
      console.warn('Cannot get current location', e);
    } finally {
      this.isLocating = false;
    }
  }

  // ─── Modal Actions ────────────────────────────────────────────────────────

  dismiss() {
    this.modalCtrl.dismiss();
  }

  confirmLocation() {
    if (!this.selectedAddress && (this.map.getZoom() <= 16)) {
      this.ui.showToast('Please select a valid address and zoom to area that you want to confirm pickup location', 'middle', 'danger');
      return;
    }
    this.modalCtrl.dismiss(
      {
        lat: this.mapCenter?.lat,
        lng: this.mapCenter?.lng,
        address: this.selectedAddress
      },
      'confirm'
    );

  }
}
