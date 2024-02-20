import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { AuthService } from "./auth.service";
import { Fap } from '../shared/fap.interface';
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class StadisticsService {

  currentUser = this.authService.actualUser;
  fapsUser: any = [];
  
  constructor(
    private angularFirestore: AngularFirestore,
    private authService: AuthService,
    private http: HttpClient
  ) { }


  public getFaps(id: any) {
    const url = `${environment.apiURL}/users/${id}/faps`;
    return this.http.get<any>(url);
  }
}
