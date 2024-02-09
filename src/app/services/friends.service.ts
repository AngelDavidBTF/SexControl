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

    return this.angularFirestore.collection("groups").add(groupObj);
  }

  public getGroups(user: any) {
    return this.angularFirestore
      .collection("groups", (ref) => ref.where("users", "array-contains", user))
      .snapshotChanges();
  }

  public chargeEditGroup(group: any) {
    this.actualGroup = group;
    this.router.navigate(["edit-group"]);
  }

  
  public getFriendsByGroup(startAfterDoc?: any) {
    let query: AngularFirestoreCollection<any>;
    query = this.angularFirestore
      .collection("users", (ref) =>
        ref.where("uid", "in", this.actualGroup.data.users).orderBy("uid")
      );
      
      /*if (startAfterDoc) {
        query = query.ref.startAfter(startAfterDoc);
      } */
  
      return query.snapshotChanges();
  }

  public getFriendsNotInGroup() {
    // return this.angularFirestore.collection('users', ref =>  ref.where('uid', 'not-in', this.actualGroup.data.users).where('uid', 'in', this.uidFriends)).snapshotChanges();
    return this.angularFirestore
      .collection("users")
      .doc(this.actualUidUser)
      .collection("friends", (ref) =>
        ref.where("uidFriend", "not-in", this.actualGroup.data.users).limit(10)
      )
      .snapshotChanges();
  }

  public addFriendToGroup(listUid: any) {
    let that = this;
    listUid.map(function (uid: any) {
      that.angularFirestore
        .collection("groups")
        .doc(that.actualGroup.id)
        .update({
          users: firebase.firestore.FieldValue.arrayUnion(uid),
        });
    });
    this.router.navigate(["/tabs/amigos"]);
  }

  public deleteFriendInGroup(uid: any) {
    return this.angularFirestore
      .collection("groups")
      .doc(this.actualGroup.id)
      .update({
        users: firebase.firestore.FieldValue.arrayRemove(uid),
      })
      .then(() => {
        for (let i = 0; i < this.actualGroup.data.users.length; i++) {
          if (this.actualGroup.data.users[i] === uid) {
            this.actualGroup.data.users.splice(i, 1);
          }
        }
      });
  }

  public deleteGroup(id: any) {
    this.angularFirestore.collection("groups").doc(id).delete();
    this.router.navigate(["/tabs/amigos"]);
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
    return this.angularFirestore
      .collection("fap", (ref) =>
        ref.where("uid", "in", this.actualGroup.data.users)
      )
      .snapshotChanges();
  }

  public getNumeroFapByFriends(friends: any) {
    return this.angularFirestore
      .collection("fap", (ref) => ref.where("uid", "in", friends))
      .snapshotChanges();
      // Para obtener la siguiente página
      //const nextQuery = query.startAfter(lastVisibleDocument);
  }
}
