"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { conferirSenha, gerarHashDeSenha, validarForcaDaSenha } from "@/lib/senha";
import type { Papel } from "@/lib/sessao";
import { abrirSessao, exigirSessao } from "@/lib/sessaoServidor";

export type EstadoDaTrocaDeSenha = { erro?: string };

/**
 * Troca da própria senha.
 *
 * Exige a senha atual mesmo quem já está autenticado: sem isso, uma
 * sessão esquecida aberta em um computador da loja permitiria trocar a
 * senha e tomar a conta.
 */
export async function trocarMinhaSenha(
  _estadoAnterior: EstadoDaTrocaDeSenha,
  dados: FormData,
): Promise<EstadoDaTrocaDeSenha> {
  const sessao = await exigirSessao();

  const senhaAtual = String(dados.get("senhaAtual") ?? "");
  const novaSenha = String(dados.get("novaSenha") ?? "");
  const confirmacao = String(dados.get("confirmacao") ?? "");

  const conta = await db.usuario.findUnique({ where: { id: sessao.id } });
  if (!conta || !conta.ativo) return { erro: "Conta indisponível." };

  if (!(await conferirSenha(senhaAtual, conta.senhaHash))) {
    return { erro: "A senha atual está incorreta." };
  }

  const problema = validarForcaDaSenha(novaSenha);
  if (problema) return { erro: problema };

  if (novaSenha !== confirmacao) {
    return { erro: "A confirmação não confere com a nova senha." };
  }

  if (await conferirSenha(novaSenha, conta.senhaHash)) {
    return { erro: "A nova senha precisa ser diferente da atual." };
  }

  await db.usuario.update({
    where: { id: conta.id },
    data: {
      senhaHash: await gerarHashDeSenha(novaSenha),
      precisaTrocarSenha: false,
      tentativasFalhas: 0,
      bloqueadoAte: null,
    },
  });

  // A sessão carrega a marca de senha provisória: precisa ser refeita.
  await abrirSessao({
    id: conta.id,
    nome: conta.nome,
    usuario: conta.usuario,
    papel: conta.papel as Papel,
    precisaTrocarSenha: false,
  });

  redirect("/");
}
