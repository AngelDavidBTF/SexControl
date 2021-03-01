import { RequestFriend } from './request.interface';
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified?: boolean;
  RequestFriend?: Array<RequestFriend>;
}
