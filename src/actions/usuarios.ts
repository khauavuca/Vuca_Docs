"use server";

import { revalidatePath } from "next/cache";
import type { Papel } from "@prisma/client";

import { registrar } from "@/lib/auditoria";
import { db } from "@/lib/db";
import { gerarHashDeSenha, validarForcaDaSenha } from "@/lib/senha";
import { exigirAdministrador } from "@/lib/sessaoServidor";

export type EstadoDoUsuario = { erro?: string; aviso?: string };

const PAPEIS_VALIDOS: Papel[] = [
  "ADMINISTRADOR",
  "REVISOR",
  "AUTOR",
  "COLABORADOR",
  "LEITOR",
];

export async function criarUsuario(
  _estadoAnterior: EstadoDoUsuario,
  dados: FormData,
): Promise<EstadoDoUsuario> {
  const sessao = await exigirAdministrador();

  const nome = String(dados.get("nome") ?? "").trim();
  const usuario = String(dados.get("usuario") ?? "").trim().toLowerCase();
  const senha = String(dados.get("senha") ?? "");
  const papel = String(dados.get("papel") ?? "LEITOR") as Papel;

  if (nome.length < 2) return { erro: "Informe o nome da pessoa." };
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) {
    return {
      erro: "O usuário aceita apenas letras, números, ponto, hífen e sublinhado, de 3 a 30 caracteres.",
    };
  }

  const problemaNaSenha = validarForcaDaSenha(senha);
  if (problemaNaSenha) return { erro: problemaNaSenha };

  if (!PAPEIS_VALIDOS.includes(papel)) return { erro: "Perfil inválido." };

  const jaExiste = await db.usuario.findUnique({ where: { usuario } });
  if (jaExiste) return { erro: "Já existe uma conta com este usuário." };

  const conta = await db.usuario.create({
    data: {
      nome,
      usuario,
      papel,
      senhaHash: await gerarHashDeSenha(senha),
      // Senha provisória: a pessoa troca no primeiro acesso.
      precisaTrocarSenha: true,
    },
  });

  await registrar({
    acao: "CRIACAO",
    entidade: "usuario",
    entidadeId: conta.id,
    descricao: `Criou a conta de ${nome} (${usuario}) com o perfil ${papel.toLowerCase()}`,
    autorId: sessao.id,
  });

  revalidatePath("/admin/usuarios");
  return { aviso: `Conta de ${nome} criada.` };
}

export async function alterarPapel(dados: FormData) {
  const sessao = await exigirAdministrador();

  const id = String(dados.get("id") ?? "").trim();
  const papel = String(dados.get("papel") ?? "") as Papel;

  if (!id || !PAPEIS_VALIDOS.includes(papel)) return;

  // Ninguém pode rebaixar a si mesmo e deixar a base sem administrador.
  if (id === sessao.id) return;

  const conta = await db.usuario.update({ where: { id }, data: { papel } });

  await registrar({
    acao: "ACESSO_ALTERADO",
    entidade: "usuario",
    entidadeId: conta.id,
    descricao: `Mudou o perfil de ${conta.nome} para ${papel.toLowerCase()}`,
    autorId: sessao.id,
  });

  revalidatePath("/admin/usuarios");
}

export async function alternarAcesso(dados: FormData) {
  const sessao = await exigirAdministrador();

  const id = String(dados.get("id") ?? "").trim();
  if (!id || id === sessao.id) return;

  const conta = await db.usuario.findUnique({ where: { id } });
  if (!conta) return;

  await db.usuario.update({
    where: { id },
    data: { ativo: !conta.ativo, tentativasFalhas: 0, bloqueadoAte: null },
  });

  await registrar({
    acao: "ACESSO_ALTERADO",
    entidade: "usuario",
    entidadeId: conta.id,
    descricao: `${conta.ativo ? "Desligou" : "Reativou"} o acesso de ${conta.nome}`,
    autorId: sessao.id,
  });

  revalidatePath("/admin/usuarios");
}

export async function redefinirSenha(dados: FormData) {
  const sessao = await exigirAdministrador();

  const id = String(dados.get("id") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");
  if (!id) return;

  const problema = validarForcaDaSenha(senha);
  if (problema) throw new Error(problema);

  const conta = await db.usuario.update({
    where: { id },
    data: {
      senhaHash: await gerarHashDeSenha(senha),
      // Quem redefine conhece a senha, então ela vale só até o próximo acesso.
      precisaTrocarSenha: true,
      tentativasFalhas: 0,
      bloqueadoAte: null,
    },
  });

  await registrar({
    acao: "ACESSO_ALTERADO",
    entidade: "usuario",
    entidadeId: conta.id,
    descricao: `Redefiniu a senha de ${conta.nome}`,
    autorId: sessao.id,
  });

  revalidatePath("/admin/usuarios");
}
