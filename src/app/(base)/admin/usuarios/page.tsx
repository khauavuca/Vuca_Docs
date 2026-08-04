import type { Metadata } from "next";

import { alterarPapel, alternarAcesso, redefinirSenha } from "@/actions/usuarios";
import { FormularioDeNovoUsuario } from "@/components/FormularioDeNovoUsuario";
import { db } from "@/lib/db";
import { exigirAdministrador } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Pessoas" };

const PAPEIS = [
  { valor: "LEITOR", rotulo: "Leitor" },
  { valor: "COLABORADOR", rotulo: "Colaborador" },
  { valor: "AUTOR", rotulo: "Autor" },
  { valor: "REVISOR", rotulo: "Revisor" },
  { valor: "ADMINISTRADOR", rotulo: "Administrador" },
];

export default async function PaginaDePessoas() {
  const sessao = await exigirAdministrador();

  const usuarios = await db.usuario.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-1 font-medium text-slate-900">Nova conta</h2>
        <p className="mb-4 text-sm text-slate-600">
          Não existe cadastro aberto. Toda conta é criada aqui, e o acesso é
          desligado no mesmo lugar quando alguém sai da empresa.
        </p>
        <FormularioDeNovoUsuario />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Pessoa</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Acesso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((usuario) => {
              const ehVoce = usuario.id === sessao.id;

              return (
                <tr key={usuario.id} className={usuario.ativo ? "" : "bg-slate-50/60"}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {usuario.nome}
                      {ehVoce ? (
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          (você)
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-500">{usuario.usuario}</p>

                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-slate-500 hover:text-blue-700">
                        Redefinir senha
                      </summary>
                      <form action={redefinirSenha} className="mt-2 flex gap-2">
                        <input type="hidden" name="id" value={usuario.id} />
                        <input
                          name="senha"
                          type="text"
                          required
                          placeholder="Nova senha provisória"
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Salvar
                        </button>
                      </form>
                    </details>
                  </td>

                  <td className="px-4 py-3">
                    {ehVoce ? (
                      <span className="text-slate-600">Administrador</span>
                    ) : (
                      <form action={alterarPapel} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={usuario.id} />
                        <select
                          name="papel"
                          defaultValue={usuario.papel}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        >
                          {PAPEIS.map((papel) => (
                            <option key={papel.valor} value={papel.valor}>
                              {papel.rotulo}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Salvar
                        </button>
                      </form>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {ehVoce ? (
                      <span className="text-slate-500">—</span>
                    ) : (
                      <form action={alternarAcesso}>
                        <input type="hidden" name="id" value={usuario.id} />
                        <button
                          type="submit"
                          className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                            usuario.ativo
                              ? "border-red-200 text-red-700 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {usuario.ativo ? "Desligar acesso" : "Reativar acesso"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
