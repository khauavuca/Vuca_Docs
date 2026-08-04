"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { conferirSenha } from "@/lib/senha";
import { abrirSessao, encerrarSessao } from "@/lib/sessaoServidor";
import type { Papel } from "@/lib/sessao";

const LIMITE_DE_TENTATIVAS = 5;
const MINUTOS_DE_BLOQUEIO = 15;

export type EstadoDoLogin = { erro?: string };

export async function entrar(
  _estadoAnterior: EstadoDoLogin,
  dadosDoFormulario: FormData,
): Promise<EstadoDoLogin> {
  const usuario = String(dadosDoFormulario.get("usuario") ?? "").trim().toLowerCase();
  const senha = String(dadosDoFormulario.get("senha") ?? "");
  const destino = String(dadosDoFormulario.get("destino") ?? "/");

  if (!usuario || !senha) {
    return { erro: "Preencha o usuário e a senha." };
  }

  const conta = await db.usuario.findUnique({ where: { usuario } });

  // Mensagem única para usuário inexistente e senha errada: dizer qual dos
  // dois está errado entregaria a lista de usuários válidos a quem tentasse.
  const recusa = { erro: "Usuário ou senha incorretos." };

  if (!conta || !conta.ativo) return recusa;

  if (conta.bloqueadoAte && conta.bloqueadoAte > new Date()) {
    return {
      erro: `Acesso bloqueado por tentativas seguidas. Tente novamente em alguns minutos.`,
    };
  }

  const senhaConfere = await conferirSenha(senha, conta.senhaHash);

  if (!senhaConfere) {
    const tentativas = conta.tentativasFalhas + 1;
    await db.usuario.update({
      where: { id: conta.id },
      data: {
        tentativasFalhas: tentativas,
        bloqueadoAte:
          tentativas >= LIMITE_DE_TENTATIVAS
            ? new Date(Date.now() + MINUTOS_DE_BLOQUEIO * 60 * 1000)
            : null,
      },
    });
    return recusa;
  }

  await db.usuario.update({
    where: { id: conta.id },
    data: { tentativasFalhas: 0, bloqueadoAte: null },
  });

  await abrirSessao({
    id: conta.id,
    nome: conta.nome,
    usuario: conta.usuario,
    papel: conta.papel as Papel,
    precisaTrocarSenha: conta.precisaTrocarSenha,
  });

  if (conta.precisaTrocarSenha) redirect("/conta/senha");

  // Só aceita destino interno, para não virar ponte para outro site.
  redirect(destino.startsWith("/") && !destino.startsWith("//") ? destino : "/");
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/entrar");
}
