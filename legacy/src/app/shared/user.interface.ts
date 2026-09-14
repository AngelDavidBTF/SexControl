import { RequestFriend } from './request.interface';
export interface User {
  [x: string]: any;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified?: boolean;
  RequestFriend?: Array<RequestFriend>;
  friends?: Array<any>;
}
