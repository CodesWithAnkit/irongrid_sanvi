import { api } from "../../lib/api";
import type { AuthUser, LoginRequest, LoginResponse, OkResponse, Profile } from "./types";

export async function login(payload: LoginRequest): Promise<AuthUser> {
  const res = await api.post<LoginResponse>("/auth/login", payload);
  return res.data.user;
}

export async function logout(): Promise<OkResponse> {
  const res = await api.post<OkResponse>("/auth/logout");
  return res.data;
}

export async function refresh(): Promise<OkResponse> {
  const res = await api.post<OkResponse>("/auth/refresh");
  return res.data;
}

export async function me(): Promise<Profile> {
  const res = await api.get<Profile>("/auth/me");
  return res.data;
}
