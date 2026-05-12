import { TestBed } from '@angular/core/testing';

import { Uiservice } from './uiservice';

describe('Uiservice', () => {
  let service: Uiservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Uiservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
