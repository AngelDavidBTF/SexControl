import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RequestFriendsPage } from './request-friends.page';

describe('RequestFriendsPage', () => {
  let component: RequestFriendsPage;
  let fixture: ComponentFixture<RequestFriendsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestFriendsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RequestFriendsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
