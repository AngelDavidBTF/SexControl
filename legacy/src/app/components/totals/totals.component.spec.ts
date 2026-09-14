import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TotalsComponent } from './totals.component';

describe('TotalsComponent', () => {
  let component: TotalsComponent;
  let fixture: ComponentFixture<TotalsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TotalsComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TotalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
