import { SignJWT, jwtVerify } from "jose";

/**
 * Sessão guardada em cookie assinado. Este arquivo não importa o Prisma
 * de propósito: ele também roda no middleware, que não tem acesso ao banco.
 */

export const NOME_COOKIE = "vuca_sessao";
const DURACAO_EM_HORAS = 12;

export type Papel =
  | "ADMINISTRADOR"
  | "REVISOR"
  | "AUTOR"
  | "COLABORADOR"
  | "LEITOR";

export type DadosSessao = {
  id: string;
  nome: string;
  usuario: string;
  papel: Papel;
  /** Enquanto verdadeiro, a navegação fica presa na troca de senha. */
  precisaTrocarSenha: boolean;
};

function segredo(): Uint8Array {
  const valor = process.env.SESSAO_SEGREDO;
  if (!valor || valor.length < 32) {
    throw new Error(
      "SESSAO_SEGREDO ausente ou curto demais. Defina um valor com pelo menos 32 caracteres.",
    );
  }
  return new TextEncoder().encode(valor);
}

export async function assinarSessao(dados: DadosSessao): Promise<string> {
  return new SignJWT({ ...dados })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_EM_HORAS}h`)
    .sign(segredo());
}

export async function lerSessao(token?: string): Promise<DadosSessao | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, segredo());
    if (!payload.id || !payload.usuario || !payload.papel) return null;

    return {
      id: String(payload.id),
      nome: String(payload.nome ?? ""),
      usuario: String(payload.usuario),
      papel: payload.papel as Papel,
      precisaTrocarSenha: payload.precisaTrocarSenha === true,
    };
  } catch {
    // Assinatura inválida ou prazo vencido: trata como quem não entrou.
    return null;
  }
}

export const duracaoDoCookieEmSegundos = DURACAO_EM_HORAS * 60 * 60;

/** Hierarquia usada para comparar papéis. Quanto maior, mais permissões. */
const ordemDoPapel: Record<Papel, number> = {
  LEITOR: 0,
  COLABORADOR: 1,
  AUTOR: 2,
  REVISOR: 3,
  ADMINISTRADOR: 4,
};

export function temPapelMinimo(papel: Papel, minimo: Papel): boolean {
  return ordemDoPapel[papel] >= ordemDoPapel[minimo];
}

/** Pode criar e editar rascunho. */
export function podeEscrever(papel: Papel): boolean {
  return temPapelMinimo(papel, "COLABORADOR");
}

/** Pode publicar, devolver e tirar do ar. */
export function podePublicar(papel: Papel): boolean {
  return temPapelMinimo(papel, "REVISOR");
}

/** Pode mexer na estrutura de áreas e nas contas de acesso. */
export function podeAdministrar(papel: Papel): boolean {
  return papel === "ADMINISTRADOR";
}
