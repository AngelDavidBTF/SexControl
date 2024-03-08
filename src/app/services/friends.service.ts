import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";
import { AngularFireStorage } from "@angular/fire/storage";
import { finalize } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { ApiService } from "./api.service";

@Injectable({
  providedIn: "root",
})
export class FriendsService {
  constructor(
    private apiService: ApiService,
    private storage: AngularFireStorage,
    private router: Router,
    private http: HttpClient
  ) {}

  actualGroup: any;
  actualUidUser: any;
  uidFriends: any;
  public requestFriend: any;
  friends: any;
  friendsInGroup: any;
  private friendsSubject = new BehaviorSubject<any>(null);
  friendsObs$ = this.friendsSubject.asObservable();

  private filePath: any;
  private downloadUrl: Observable<string>;

  public getAllUsers(): Observable<any> {
    return this.apiService.get('users');
  }

  public sendRequestFriend(peticion: any): Observable<any> {
    return this.apiService.post('friendRequest', peticion);
  }

  public getRequestFriends(uid: string): Observable<any> {
    return this.apiService.post('requestFriendsByUid', { uid });
  }

  public getFriends(uid: string): Observable<any> {
    return this.apiService.post('friendsByUid', { uid });
  }

  public async processRequestFriend(requestFriend: any, aceptado: boolean): Promise<void> {
    const url = aceptado
      ? `friendRequest/aceptar/${requestFriend.request_id}`
      : `friendRequest/${requestFriend.request_id}`;

    try {
      if (aceptado) {
        requestFriend.accepted = true;
        await this.apiService.put(url, requestFriend).toPromise();
      } else {
        await this.apiService.delete(url).toPromise();
      }
      this.requestFriend = this.requestFriend.filter(user => user.id !== requestFriend.id);
    } catch (error) {
      console.error('Error processing requestFriend:', error);
      throw error;
    }
  }

  public createGroup(group: any): Observable<any> {
    const groupObj = {
      name: group.name,
      groupImage: this.downloadUrl ? this.downloadUrl : '',
      users: group.users,
      creationDate: group.creationDate,
      fileRef: this.filePath ? this.filePath : ''
    };
    return this.apiService.post('groups/createGroup', groupObj);
  }

  public getGroups(): Observable<any> {
    return this.apiService.post('groups/groupsByUser');
  }

  public chargeEditGroup(group: any): void {
    // No es necesario adaptar este método ya que no hace una llamada HTTP
    this.actualGroup = group;
    this.router.navigate(['edit-group']);
  }

  
  public getFriendsByGroup(group?: any): Observable<any> {
    const group_id = { "group_id": group.id };
    return this.apiService.post('groups/users', group_id);
  }

  public addFriendToGroup(listIds: any): Observable<any> {
    const groupObj = {
      users: listIds,
      group: this.actualGroup.id
    };
    return this.apiService.post('groups/addUserGroup', groupObj);
  }

  public deleteFriendInGroup(id: any): Observable<any> {
    const groupObj = {
      user_id: id,
      group_id: this.actualGroup.id
    };
    return this.apiService.post('users/group/detach', groupObj);
  }

  public deleteGroup(id: any): Observable<any> {
    return this.apiService.delete(`groups/${id}`);
  }

  public preSaveGroup(image: any, group: any) {
    this.uploadImageGroup(image, group);
  }

  private uploadImageGroup(image: any, group: any) {
    if (image) {
      var aleatorio = Math.random();
      this.filePath = `images/${aleatorio + image.name}`;
      const fileRef = this.storage.ref(this.filePath);
      const task = this.storage.upload(this.filePath, image);
      task
        .snapshotChanges()
        .pipe(
          finalize(() => {
            fileRef.getDownloadURL().subscribe((urlImage) => {
              this.downloadUrl = urlImage;
              this.createGroup(group);
            });
          })
        )
        .subscribe();
    } else {
      this.createGroup(group);
    }
  }

  public getNumeroFapByGroup(): Observable<any> {
    const url = `groups/${this.actualGroup.id}/faps`;
    return this.apiService.get(url);
  }

  public getFapByFriends(): Observable<any> {
    const url = 'faps/friends';
    return this.apiService.get(url);
  }

  public setData(data: any) {
    this.friendsSubject.next(data);
  }
}
