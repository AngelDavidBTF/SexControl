import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { RequestFriend } from '../shared/request.interface';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  constructor(private angularFirestore: AngularFirestore) { }

  public getUsers(uid: any) {
    return this.angularFirestore.collection('users', ref =>  ref.where('uid', '!=', uid)).snapshotChanges();
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
  }

  public getRequestFriends(uid: any) {
    return this.angularFirestore.collection('users').doc(uid).collection('requestFriend', ref =>  ref.where('aceptado', '==', false)).snapshotChanges();
  }

  public getFriends(uid: any) {
    return this.angularFirestore.collection('users').doc(uid).collection('friends', ref =>  ref.where('aceptado', '==', true)).snapshotChanges();
  }

  public proccessRequestFriend(requestFriend: RequestFriend, usuarioPeticion: RequestFriend) {

    this.angularFirestore.collection('users').doc(requestFriend.uidDestinatario).collection('requestFriend')
    .doc(requestFriend.uidRemitente).update({
      aceptado: requestFriend.aceptado
    });

    this.angularFirestore.collection('users').doc(usuarioPeticion.uidDestinatario).collection('requestFriend')
    .doc(usuarioPeticion.uidRemitente).update({
      aceptado: requestFriend.aceptado
    });

    if (requestFriend.aceptado === true) {
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
}
