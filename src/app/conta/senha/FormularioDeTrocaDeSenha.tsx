"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { trocarMinhaSenha, type EstadoDaTrocaDeSenha } from "@/actions/conta";

const CAMPO =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

function Botao() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Salvar nova senha"}
    </button>
  );
}

export function FormularioDeTrocaDeSenha() {
  const [estado, acao] = useActionState<EstadoDaTrocaDeSenha, FormData>(
    trocarMinhaSenha,
    {},
  );

  return (
    <form action={acao} className="space-y-4">
      <div>
        <label htmlFor="senhaAtual" className="mb-1.5 block text-sm font-medium text-slate-700">
          Senha atual
        </label>
        <input
          id="senhaAtual"
          name="senhaAtual"
          type="password"
          autoComplete="current-password"
          required
          className={CAMPO}
        />
      </div>

      <div>
        <label htmlFor="novaSenha" className="mb-1.5 block text-sm font-medium text-slate-700">
          Nova senha
        </label>
        <input
          id="novaSenha"
          name="novaSenha"
          type="password"
          autoComplete="new-password"
          required
          className={CAMPO}
        />
        <p className="mt-1 text-xs text-slate-500">
          Mínimo de 8 caracteres, com letra e número.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmacao"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Repita a nova senha
        </label>
        <input
          id="confirmacao"
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          required
          className={CAMPO}
        />
      </div>

      {estado.erro ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.erro}
        </p>
      ) : null}

      <Botao />
    </form>
  );
}
