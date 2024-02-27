/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AnunciosComponent } from './anuncios.component';

describe('AnunciosComponent', () => {
  let component: AnunciosComponent;
  let fixture: ComponentFixture<AnunciosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnunciosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnunciosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
