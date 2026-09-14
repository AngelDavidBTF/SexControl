import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private apiUrl = environment.apiURL; // Reemplaza con la URL de tu API

  constructor(private http: HttpClient) { }

  private setHeaders(): HttpHeaders {
    const headersConfig = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Agregar token de autenticación si está presente en el almacenamiento local
    const token = localStorage.getItem('token');
    if (token) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headersConfig);
  }

  private formatErrors(error: any): any {
    console.error('Error en la solicitud:', error);
    return throwError(error.error);
  }

  get(path: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${path}`, { headers: this.setHeaders() })
      .pipe(catchError(this.formatErrors));
  }

  put(path: string, body: any = {}): Observable<any> {
    return this.http.put(`${this.apiUrl}/${path}`, JSON.stringify(body), { headers: this.setHeaders() })
      .pipe(catchError(this.formatErrors));
  }

  post(path: string, body: any = {}): Observable<any> {
    return this.http.post(`${this.apiUrl}/${path}`, JSON.stringify(body), { headers: this.setHeaders() })
      .pipe(catchError(this.formatErrors));
  }

  delete(path: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${path}`, { headers: this.setHeaders() })
      .pipe(catchError(this.formatErrors));
  }
}
