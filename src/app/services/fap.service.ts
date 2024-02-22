import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Fap } from '../shared/fap.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FapService {

  constructor(private apiService: ApiService,
    private http: HttpClient) { }

    public getNumeroFap(uid): Observable<any> {
      const url = `users/${uid}/faps`; // No es necesario incluir environment.apiURL
      return this.apiService.get(url);
    }
  
    public insertarFap(fap: Fap): Observable<any> {
      const url = `faps/suma`; // No es necesario incluir environment.apiURL
      return this.apiService.post(url, fap);
    }
  
    public borrarFap(lastId: any): Observable<any> {
      const url = `faps/${lastId}`; // No es necesario incluir environment.apiURL
      return this.apiService.delete(url)
        .pipe(
          catchError(error => {
            console.error('Error al eliminar el registro:', error);
            throw error;
          })
        );
    }
}
