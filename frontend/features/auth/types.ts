export type AuthUser = {
  id: number;
  email: string;
};

export type Profile = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
};

export type OkResponse = { ok: true };
