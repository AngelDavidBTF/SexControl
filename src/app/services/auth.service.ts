import { Injectable, NgZone } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import 'firebase/auth';
import 'firebase/firestore';
import { Observable, of  } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { User } from '../shared/user.interface';
import firebase from 'firebase/app';
import { UiServiceService } from './ui-service.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public user$: Observable<User>;
  public actualUser: User;
  public user: any;

  constructor(public afAuth: AngularFireAuth, 
    private afs: AngularFirestore,
    private uiServiceService: UiServiceService,
    private http: HttpClient) {

      this.user$ = this.afAuth.authState.pipe(
        switchMap((user) => {
          if (user) {
            this.actualUser = user;
            return of(user);
          }
          return of(null);
        })
      );
  }

  public getActualUser() {
    return this.user;
  }

  async resetPassword(email: string): Promise<void> {
    try {
      return this.afAuth.sendPasswordResetEmail(email);
    } catch (error) {
      console.log('Error->', error);
    }
  }

  async loginGoogle(): Promise<User> {
    try {
      const { user } = await this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      this.updateUserData(user);
      return user;
    } catch (error) {
      console.log('Error->', error);
    }
  }

  async register(email: string, password: string, userF: any): Promise<User> {
    try {
      const { user } = await this.afAuth.createUserWithEmailAndPassword(email, password);
      await user.updateProfile({
        displayName: userF
      });
      await this.sendVerifcationEmail();
      await this.sendUserData(user);
      return user;
    } catch (error) {
      console.log('Error->', error);
    }
  }

  private async sendUserData(user: firebase.User): Promise<void> {
    const url = `${environment.apiURL}/users`; // Endpoint en Laravel para guardar usuario
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
    try {
      await this.http.post(url, userData).toPromise();
    } catch (error) {
      console.log('Error sending user data to Laravel:', error);
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const { user } = await this.afAuth.signInWithEmailAndPassword(email, password);
      this.updateUserData(user);
      return user;
    } catch (error) {
      if (error.code == 'auth/invalid-email') {
        error = 'El email tiene un formato incorrecto'
      }
      if (error.code == 'auth/wrong-password' || error.code == 'auth/user-not-found') {
        error = 'El email o la contraseña no son correctos'
      }
      this.uiServiceService.alertaInformativa(error);
    }
  }

  async sendVerifcationEmail(): Promise<void> {
    try {
      return (await this.afAuth.currentUser).sendEmailVerification();
    } catch (error) {
      console.log('Error->', error);
    }
  }

  isEmailVerified(user: User): boolean {
    return user.emailVerified === true ? true : false;
  }

  async logout(): Promise<void> {
    try {
      await this.afAuth.signOut();
    } catch (error) {
      console.log('Error->', error);
    }
  }

  /*private updateUserData(user: User) {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${user.uid}`);

    const data: User = {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
    };

    //return userRef.set(data, { merge: true });
    const url = `${environment.apiURL}/users/${user.uid}`; 
    return this.http.post(url, user);
  }*/

  async updateUserData(user: User): Promise<void> {
    const url = `${environment.apiURL}/users/${user.uid}`; 
    try {
      await this.http.put(url, user).toPromise();
    } catch (error) {
      console.log('Error updating user data:', error);
    }
  }

  public getUserAuth() {
    return this.afAuth.authState;
  }
}
