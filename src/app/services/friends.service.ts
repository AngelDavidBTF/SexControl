import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { RequestFriend } from '../shared/request.interface';
import firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { AngularFireStorage } from "@angular/fire/storage";
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  constructor(
    private angularFirestore: AngularFirestore,
    private storage: AngularFireStorage,
    private router: Router) { }

  actualGroup: any;
  actualUidUser: any;
  uidFriends: any;

  private filePath: any;
  private downloadUrl: Observable<string>;

  public getUsers(uid: any) {
    
    return this.angularFirestore.collection('users', ref =>  ref.where('uid', '!=', uid)).snapshotChanges();
    
    /*uidFriends = uidFriends && uidFriends.length !== 0 ? uidFriends : [''];
    uidFriends.push(uid);
    return this.angularFirestore.collection('users', ref =>  ref.where('uid', 'not-in', uidFriends))
    .snapshotChanges(); */
  }

  public sendRequestFriend(requestFriend: RequestFriend) {

    this.angularFirestore.collection('users').doc(requestFriend.uidDestinatario).collection('requestFriend')
    .doc(requestFriend.uidRemitente).set({
      uidDestinatario: requestFriend.uidDestinatario,
      uidRemitente: requestFriend.uidRemitente,
      photoURL: requestFriend.photoURL,
      displayName: requestFriend.displayName,
      email: requestFriend.email,
      aceptado: false
    });
    
    this.angularFirestore.collection('users').doc(requestFriend.uidRemitente).update({
      sendRequestUsers: firebase.firestore.FieldValue.arrayUnion(requestFriend.uidDestinatario)
    });

    /* this.angularFirestore.collection('users').doc(requestFriend.uidDestinatario).update({
      requestFriend: firebase.firestore.FieldValue.arrayUnion(requestFriend.uidRemitente)
    }); */

  }

  public getRequestFriends(uid: any) {
    /*uidRequests = uidRequests && uidRequests.length !== 0 ? uidRequests : [''];
    uidRequests = [''];
      return this.angularFirestore.collection('users', ref =>  ref.where('uid', 'in', uidRequests))
      .snapshotChanges(); */
    return this.angularFirestore.doc(`users/${uid}`).collection('requestFriend', ref =>  ref.where('aceptado', '==', false)).snapshotChanges();
  }

  public getFriends(uid: any) {
    this.actualUidUser = uid;
    return this.angularFirestore.doc(`users/${uid}`).collection('friends', ref =>  ref.where('aceptado', '==', true)).snapshotChanges();
  }

  public proccessRequestFriend(requestFriend: RequestFriend, usuarioPeticion: RequestFriend) {

    if (requestFriend.aceptado === true) {
      /* this.angularFirestore.collection('users').doc(requestFriend.uidRemitente).update({
        friends: firebase.firestore.FieldValue.arrayUnion(requestFriend.uidDestinatario)
      });

      this.angularFirestore.collection('users').doc(requestFriend.uidDestinatario).update({
        friends: firebase.firestore.FieldValue.arrayUnion(requestFriend.uidRemitente)
      });

      this.angularFirestore.collection('users').doc(requestFriend.uidDestinatario).update({
        requestFriend: firebase.firestore.FieldValue.arrayRemove(requestFriend.uidRemitente)
      }); */

      this.angularFirestore.collection('users').doc(requestFriend.uidDestinatario).collection('requestFriend')
      .doc(requestFriend.uidRemitente).update({
        aceptado: requestFriend.aceptado
      });
  
      this.angularFirestore.collection('users').doc(usuarioPeticion.uidDestinatario).collection('requestFriend')
      .doc(usuarioPeticion.uidRemitente).update({
        aceptado: requestFriend.aceptado
      });
      
      this.angularFirestore.collection('users').doc(requestFriend.uidDestinatario).collection('friends')
      .doc(requestFriend.uidRemitente).set({
        uidFriend: requestFriend.uidRemitente,
        photoURL: requestFriend.photoURL,
        displayName: requestFriend.displayName,
        email: requestFriend.email,
        aceptado: true
      });

      this.angularFirestore.collection('users').doc(usuarioPeticion.uidDestinatario).collection('friends')
      .doc(usuarioPeticion.uidRemitente).set({
        uidFriend: usuarioPeticion.uidRemitente,
        photoURL: usuarioPeticion.photoURL,
        displayName: usuarioPeticion.displayName,
        email: usuarioPeticion.email,
        aceptado: true
      });
    } else {
      this.angularFirestore.collection('users').doc(requestFriend.uidDestinatario).collection('requestFriend')
      .doc(requestFriend.uidRemitente).delete();
    }
  }

  public createGroup(group: any) {
    const groupObj = {
      name: group.name,
      groupImage: this.downloadUrl ? this.downloadUrl : '',
      users: group.users,
      creationDate: group.creationDate,
      fileRef: this.filePath ? this.filePath : ''
    };

    return this.angularFirestore.collection('groups').add(groupObj);
  }

  public getGroups(user: any) {
    return this.angularFirestore.collection('groups', ref =>  ref.where('users', 'array-contains', user)).snapshotChanges();
  }

  public chargeEditGroup(group: any) {
    this.actualGroup = group;
    this.router.navigate(["edit-group"]);
  }

  public getFriendsByGroup() {
    return this.angularFirestore.collection('users', ref =>  ref.where('uid', 'in', this.actualGroup.data.users)).snapshotChanges();
  }

  public getFriendsNotInGroup() {
    // return this.angularFirestore.collection('users', ref =>  ref.where('uid', 'not-in', this.actualGroup.data.users).where('uid', 'in', this.uidFriends)).snapshotChanges();
    return this.angularFirestore.collection('users').doc(this.actualUidUser).collection('friends', ref =>  ref.where('uidFriend', 'not-in', this.actualGroup.data.users)).snapshotChanges();
  }

  public addFriendToGroup(listUid: any) {
    let that = this;
    listUid.map(function (uid: any){
      that.angularFirestore.collection('groups').doc(that.actualGroup.id).update({
        users: firebase.firestore.FieldValue.arrayUnion(uid)
      });
    });
    this.router.navigate(["/tabs/amigos"]);
  }

  public deleteFriendInGroup(uid: any) {
    return this.angularFirestore.collection('groups').doc(this.actualGroup.id).update({
      users: firebase.firestore.FieldValue.arrayRemove(uid)
    }).then(() => {
      for (let i = 0; i < this.actualGroup.data.users.length; i++) {
        if (this.actualGroup.data.users[i] === uid) {
          this.actualGroup.data.users.splice(i, 1);
        }
      }
    });
  }

  public deleteGroup(id: any) {
    this.angularFirestore.collection('groups').doc(id).delete();
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
      task.snapshotChanges()
        .pipe(
          finalize(() => {
            fileRef.getDownloadURL().subscribe(urlImage => {
              this.downloadUrl = urlImage;
              this.createGroup(group);
            });
          })
        ).subscribe();
    } else {
      this.createGroup(group);
    }

  }

  public getNumeroFapByGroup() {
    return this.angularFirestore.collection('fap', ref =>  ref.where('uid', 'in', this.actualGroup.data.users))
    .snapshotChanges();
  }

  public getNumeroFapByFriends(friends: any) {
    return this.angularFirestore.collection('fap', ref =>  ref.where('uid', 'in', friends))
    .snapshotChanges();
  }
}
