import bcrypt from "bcryptjs";

const CUSTO = 12;

/**
 * A senha nunca é guardada em texto legível. O bcrypt já embute o sal
 * no resultado, então basta guardar o que esta função devolve.
 */
export async function gerarHashDeSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, CUSTO);
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

/** Regra mínima de senha, aplicada na criação e na troca. */
export function validarForcaDaSenha(senha: string): string | null {
  if (senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(senha)) return "A senha precisa ter pelo menos uma letra.";
  if (!/[0-9]/.test(senha)) return "A senha precisa ter pelo menos um número.";
  return null;
}
