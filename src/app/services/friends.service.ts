import { Injectable } from "@angular/core";
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { RequestFriend } from "../shared/request.interface";
import firebase from "firebase/app";
import { Observable } from "rxjs";
import { AngularFireStorage } from "@angular/fire/storage";
import { finalize } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class FriendsService {
  constructor(
    private angularFirestore: AngularFirestore,
    private storage: AngularFireStorage,
    private router: Router,
    private http: HttpClient
  ) {}

  actualGroup: any;
  actualUidUser: any;
  uidFriends: any;
  requestFriend: any;
  friends: any;
  friendsInGroup: any;

  private filePath: any;
  private downloadUrl: Observable<string>;

  public getAllUsers() {
    const url = `${environment.apiURL}/users`;
    return this.http.get<any>(url);
  }

  public sendRequestFriend(peticion: any): Observable<any>{
    const url = `${environment.apiURL}/friendRequest`;
    return this.http.post<any>(url, peticion);
  }

  public getRequestFriends(uid: string) {
    const url = `${environment.apiURL}/requestFriendsByUid`;
    const user = {
      "uid" : uid
    }
    return this.http.post<any>(url, user);
  }

  public getFriends(uid: string) {
    const url = `${environment.apiURL}/friendsByUid`;
    const user = {
      "uid" : uid
    }
    return this.http.post<any>(url, user);
  }

  public async proccessRequestFriend(requestFriend: any, aceptado: boolean) {
    
    if (aceptado === true) {
      requestFriend.accepted = true;
      const url = `${environment.apiURL}/friendRequest/aceptar/${requestFriend.request_id}`; 
      try {
        await this.http.put(url, requestFriend).toPromise();
      } catch (error) {
        console.log('Error updating requestFriend data:', error);
      }
    } else {
      const url = `${environment.apiURL}/friendRequest/${requestFriend.request_id}`; 
      try {
        await this.http.delete(url).toPromise();
      } catch (error) {
        console.log('Error deleting requestFriend data:', error);
      }
    }
  }

  public createGroup(group: any) {
    const groupObj = {
      name: group.name,
      groupImage: this.downloadUrl ? this.downloadUrl : "",
      users: group.users,
      creationDate: group.creationDate,
      fileRef: this.filePath ? this.filePath : "",
    };
    const url = `${environment.apiURL}/groups/createGroup`;
    return this.http.post<any>(url, groupObj);
    
  }

  public getGroups(group: any) {
    const url = `${environment.apiURL}/groups/groupsByUser`;
    return this.http.post<any>(url, group);
  }

  public chargeEditGroup(group: any) {
    this.actualGroup = group;
    this.router.navigate(["edit-group"]);
  }

  
  public getFriendsByGroup(group?: any) {
    const url = `${environment.apiURL}/groups/users`;
    const group_id = {
      "group_id" : group.id
    }
    return this.http.post<any>(url, group_id);
  }

  public addFriendToGroup(listIds: any) {
    const groupObj = {
      users: listIds,
      group: this.actualGroup.id
    };
    const url = `${environment.apiURL}/groups/addUserGroup`;
    return this.http.post<any>(url, groupObj);
  }

  public deleteFriendInGroup(id: any) {
    const groupObj = {
      user_id: id,
      group_id: this.actualGroup.id
    };
    const url = `${environment.apiURL}/users/group/detach`;
    return this.http.post<any>(url, groupObj);
  }

  public deleteGroup(id: any) {
    const url = `${environment.apiURL}/groups/${id}`;
    return this.http.delete<any>(url);
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

  public getNumeroFapByGroup() {
    const url = `${environment.apiURL}/groups/${this.actualGroup.id}/faps`;
    return this.http.get<any>(url);
  }

  public getFapByFriends() {
    const url = `${environment.apiURL}/faps/friends`;
    return this.http.get<any>(url);
  }
}
