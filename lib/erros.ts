import axios from 'axios';

export function mensagemErro(err: unknown, padrao: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || padrao;
  }
  return padrao;
}