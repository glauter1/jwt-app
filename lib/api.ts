import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearSession, getAccessToken, getRefreshToken, saveTokens } from './session';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

// Cliente sem interceptor: usado no login e no refresh
export const publicApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Cliente das telas internas: manda o token e renova quando expira
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

type RequisicaoRepetivel = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let renovando: Promise<string> | null = null;

async function renovarTokens(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Sem refresh token');

  const res = await publicApi.post('/auth/refresh', { refreshToken });
  saveTokens(res.data.accessToken, res.data.refreshToken);
  return res.data.accessToken as string;
}

api.interceptors.response.use(
  (resposta) => resposta,
  async (error: AxiosError) => {
    const original = error.config as RequisicaoRepetivel | undefined;

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    try {
      if (!renovando) {
        renovando = renovarTokens().finally(() => {
          renovando = null;
        });
      }
      const novoToken = await renovando;
      original.headers.Authorization = `Bearer ${novoToken}`;
      return api(original);
    } catch (erroRefresh) {
      clearSession();
      window.location.href = '/';
      return Promise.reject(erroRefresh);
    }
  }
);

export default api;