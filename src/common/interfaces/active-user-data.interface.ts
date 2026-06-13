export interface ActiveUserData {
  id: string;
  username: string;
  role: string;
}

export interface TokenPayload {
  sub: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}
