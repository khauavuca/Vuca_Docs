"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { criarUsuario, type EstadoDoUsuario } from "@/actions/usuarios";

const CAMPO =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

function Botao() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
    >
      {pending ? "Criando…" : "Criar conta"}
    </button>
  );
}

export function FormularioDeNovoUsuario() {
  const [estado, acao] = useActionState<EstadoDoUsuario, FormData>(criarUsuario, {});

  return (
    <form action={acao} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-slate-700">
          Nome
        </label>
        <input id="nome" name="nome" required className={CAMPO} />
      </div>

      <div>
        <label htmlFor="usuario" className="mb-1.5 block text-sm font-medium text-slate-700">
          Usuário
        </label>
        <input
          id="usuario"
          name="usuario"
          required
          placeholder="nome.sobrenome"
          className={CAMPO}
        />
      </div>

      <div>
        <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-slate-700">
          Senha provisória
        </label>
        <input id="senha" name="senha" type="text" required className={CAMPO} />
        <p className="mt-1 text-xs text-slate-500">
          Mínimo de 8 caracteres, com letra e número.
        </p>
      </div>

      <div>
        <label htmlFor="papel" className="mb-1.5 block text-sm font-medium text-slate-700">
          Perfil
        </label>
        <select id="papel" name="papel" defaultValue="LEITOR" className={`${CAMPO} bg-white`}>
          <option value="LEITOR">Leitor — só consulta</option>
          <option value="COLABORADOR">Colaborador — sugere conteúdo</option>
          <option value="AUTOR">Autor — escreve e envia para revisão</option>
          <option value="REVISOR">Revisor — aprova e publica</option>
          <option value="ADMINISTRADOR">Administrador — controla tudo</option>
        </select>
      </div>

      {estado.erro ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
          {estado.erro}
        </p>
      ) : null}

      {estado.aviso ? (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">
          {estado.aviso}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Botao />
      </div>
    </form>
  );
}
