import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  NOME_COOKIE,
  assinarSessao,
  duracaoDoCookieEmSegundos,
  lerSessao,
  podeAdministrar,
  podeEscrever,
  podePublicar,
  type DadosSessao,
} from "@/lib/sessao";

/** Sessão de quem está acessando, ou null quando não há sessão válida. */
export async function obterSessao(): Promise<DadosSessao | null> {
  const armazem = await cookies();
  return lerSessao(armazem.get(NOME_COOKIE)?.value);
}

/** Usa em qualquer página que exija alguém autenticado. */
export async function exigirSessao(): Promise<DadosSessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");
  return sessao;
}

export async function exigirQuemEscreve(): Promise<DadosSessao> {
  const sessao = await exigirSessao();
  if (!podeEscrever(sessao.papel)) redirect("/");
  return sessao;
}

export async function exigirQuemPublica(): Promise<DadosSessao> {
  const sessao = await exigirSessao();
  if (!podePublicar(sessao.papel)) redirect("/");
  return sessao;
}

export async function exigirAdministrador(): Promise<DadosSessao> {
  const sessao = await exigirSessao();
  if (!podeAdministrar(sessao.papel)) redirect("/");
  return sessao;
}

export async function abrirSessao(dados: DadosSessao): Promise<void> {
  const token = await assinarSessao(dados);
  const armazem = await cookies();

  armazem.set(NOME_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: duracaoDoCookieEmSegundos,
  });
}

export async function encerrarSessao(): Promise<void> {
  const armazem = await cookies();
  armazem.delete(NOME_COOKIE);
}
