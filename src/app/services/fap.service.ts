import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Fap } from '../shared/fap.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FapService {

  constructor(private angularFirestore: AngularFirestore,
    private http: HttpClient) { }

  public consultar(coleccion) {
    return this.angularFirestore.collection(coleccion).snapshotChanges();
  }

  public getNumeroFap(uid) {
    const url = `${environment.apiURL}/users/${uid}/faps`;
    return this.http.get<any>(url);
  }

  public insertarFap(fap: Fap): Observable<any> {
    const url = `${environment.apiURL}/faps/suma`;
    return this.http.post<any>(url, fap);
  }

  public borrarFap(lastId: any): Observable<any> {
    const url = `${environment.apiURL}/faps/${lastId}`;
    return this.http.delete<any>(url)
    .pipe(
      catchError(error => {
        console.error('Error al eliminar el registro:', error);
        return throwError(error);
      })
    );
  }
}
