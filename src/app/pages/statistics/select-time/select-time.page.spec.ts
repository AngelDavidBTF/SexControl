import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SelectTimePage } from './select-time.page';

describe('SelectTimePage', () => {
  let component: SelectTimePage;
  let fixture: ComponentFixture<SelectTimePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectTimePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectTimePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
