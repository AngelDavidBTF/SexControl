import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { AuthService } from "./auth.service";
import { Fap } from '../shared/fap.interface';

@Injectable({
  providedIn: "root",
})
export class StadisticsService {

  currentUser = this.authService.actualUser;
  fapsUser: any;
  
  constructor(
    private angularFirestore: AngularFirestore,
    private authService: AuthService
  ) {
    this.fapsUser = this.angularFirestore
      .collection("fap", (ref) => ref.where("uid", "==", this.currentUser.uid))
      .snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return { id, data };
        }))
      );
  }


  public getFaps() {
    return this.fapsUser;
  }
}
