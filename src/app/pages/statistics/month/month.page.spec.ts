import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MonthPage } from './month.page';

describe('MonthPage', () => {
  let component: MonthPage;
  let fixture: ComponentFixture<MonthPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MonthPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
