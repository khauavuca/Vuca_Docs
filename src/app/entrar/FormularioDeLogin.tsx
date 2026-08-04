"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { entrar, type EstadoDoLogin } from "@/actions/autenticacao";

function BotaoEnviar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function FormularioDeLogin({ destino }: { destino: string }) {
  const [estado, acao] = useActionState<EstadoDoLogin, FormData>(entrar, {});

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="destino" value={destino} />

      <div>
        <label
          htmlFor="usuario"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Usuário
        </label>
        <input
          id="usuario"
          name="usuario"
          type="text"
          autoComplete="username"
          autoFocus
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label
          htmlFor="senha"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {estado.erro}
        </p>
      ) : null}

      <BotaoEnviar />
    </form>
  );
}
