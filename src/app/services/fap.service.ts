import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Fap } from '../shared/fap.interface';

@Injectable({
  providedIn: 'root'
})
export class FapService {

  constructor(private angularFirestore: AngularFirestore) { }

  public consultar(coleccion) {
    return this.angularFirestore.collection(coleccion).snapshotChanges();
  }

  public getNumeroFap(uid) {
    return this.angularFirestore.collection('fap', ref =>  ref.where('uid', '==', uid))
    .snapshotChanges();
  }

  public insertarFap(fap: Fap) {
    return this.angularFirestore.collection('fap').add(fap);
  }

  public borrarFap(lastId: any) {
    return this.angularFirestore.collection('fap').doc(lastId).delete();
  }
}
