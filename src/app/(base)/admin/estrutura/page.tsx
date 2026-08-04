import type { Metadata } from "next";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  arquivarArea,
  criarArea,
  criarTipo,
  excluirArea,
  excluirMarcador,
  excluirTipo,
  moverArea,
  reativarArea,
  renomearArea,
} from "@/actions/estrutura";
import { db } from "@/lib/db";
import { exigirAdministrador } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Áreas e tipos" };

const CAMPO =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const BOTAO_PRIMARIO =
  "rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800";
const BOTAO_DISCRETO =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50";

export default async function PaginaDaEstrutura() {
  await exigirAdministrador();

  const [areas, tipos, marcadores] = await Promise.all([
    db.area.findMany({
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      include: { _count: { select: { artigos: true } } },
    }),
    db.tipo.findMany({ orderBy: [{ ordem: "asc" }, { nome: "asc" }] }),
    db.marcador.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { artigos: true } } },
    }),
  ]);

  const raizes = areas.filter((area) => area.paiId === null);
  const filhasDe = (id: string) => areas.filter((area) => area.paiId === id);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="space-y-4 lg:col-span-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-1 font-medium text-slate-900">Áreas de conhecimento</h2>
          <p className="mb-4 text-sm text-slate-600">
            A estrutura é sua. Crie uma área sempre que um assunto novo
            aparecer, como uma integração recém-implantada.
          </p>

          <form action={criarArea} className="grid gap-3 sm:grid-cols-4">
            <input name="nome" placeholder="Nome da área" required className={`${CAMPO} sm:col-span-2`} />
            <select name="paiId" className={`${CAMPO} bg-white`} defaultValue="">
              <option value="">Área principal</option>
              {raizes.map((raiz) => (
                <option key={raiz.id} value={raiz.id}>
                  Dentro de {raiz.nome}
                </option>
              ))}
            </select>
            <button type="submit" className={BOTAO_PRIMARIO}>
              Criar
            </button>
            <input
              name="descricao"
              placeholder="Descrição (opcional)"
              className={`${CAMPO} sm:col-span-4`}
            />
          </form>
        </div>

        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {raizes.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-600">
              Nenhuma área criada ainda.
            </p>
          ) : null}

          {raizes.map((raiz) => (
            <div key={raiz.id} className="p-4">
              <LinhaDaArea
                area={{
                  ...raiz,
                  vazia: raiz._count.artigos === 0 && filhasDe(raiz.id).length === 0,
                }}
              />

              <div className="ml-4 mt-2 space-y-2 border-l border-slate-200 pl-4">
                {filhasDe(raiz.id).map((filha) => (
                  <LinhaDaArea
                    key={filha.id}
                    area={{ ...filha, vazia: filha._count.artigos === 0 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-medium text-slate-900">Tipos de documento</h2>

          <form action={criarTipo} className="mb-3 flex gap-2">
            <input name="nome" placeholder="Novo tipo" required className={CAMPO} />
            <button type="submit" className={BOTAO_PRIMARIO}>
              Criar
            </button>
          </form>

          <ul className="space-y-1.5">
            {tipos.map((tipo) => (
              <li key={tipo.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-700">{tipo.nome}</span>
                <form action={excluirTipo}>
                  <input type="hidden" name="id" value={tipo.id} />
                  <button type="submit" className={BOTAO_DISCRETO}>
                    Excluir
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-1 font-medium text-slate-900">Marcadores</h2>
          <p className="mb-3 text-sm text-slate-600">
            Criados automaticamente ao escrever um documento.
          </p>

          {marcadores.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum marcador ainda.</p>
          ) : (
            <ul className="space-y-1.5">
              {marcadores.map((marcador) => (
                <li key={marcador.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-700">
                    {marcador.nome}
                    <span className="ml-1 text-xs text-slate-400">
                      {marcador._count.artigos}
                    </span>
                  </span>
                  <form action={excluirMarcador}>
                    <input type="hidden" name="id" value={marcador.id} />
                    <button type="submit" className={BOTAO_DISCRETO}>
                      Excluir
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function LinhaDaArea({
  area,
}: {
  area: {
    id: string;
    nome: string;
    descricao: string | null;
    arquivada: boolean;
    vazia: boolean;
    _count: { artigos: number };
  };
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">
            {area.nome}
            {area.arquivada ? (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Arquivada
              </span>
            ) : null}
          </p>
          <p className="text-xs text-slate-500">
            {area._count.artigos === 1
              ? "1 documento"
              : `${area._count.artigos} documentos`}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <form action={moverArea}>
            <input type="hidden" name="id" value={area.id} />
            <input type="hidden" name="direcao" value="subir" />
            <button type="submit" aria-label="Subir" className={BOTAO_DISCRETO}>
              <ChevronUp className="size-3.5" />
            </button>
          </form>
          <form action={moverArea}>
            <input type="hidden" name="id" value={area.id} />
            <input type="hidden" name="direcao" value="descer" />
            <button type="submit" aria-label="Descer" className={BOTAO_DISCRETO}>
              <ChevronDown className="size-3.5" />
            </button>
          </form>

          <form action={area.arquivada ? reativarArea : arquivarArea}>
            <input type="hidden" name="id" value={area.id} />
            <button type="submit" className={BOTAO_DISCRETO}>
              {area.arquivada ? "Reativar" : "Arquivar"}
            </button>
          </form>

          {area.vazia ? (
            <form action={excluirArea}>
              <input type="hidden" name="id" value={area.id} />
              <button
                type="submit"
                className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50"
              >
                Excluir
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-slate-500 hover:text-blue-700">
          Renomear ou descrever
        </summary>
        <form action={renomearArea} className="mt-2 grid gap-2 sm:grid-cols-3">
          <input type="hidden" name="id" value={area.id} />
          <input name="nome" defaultValue={area.nome} required className={CAMPO} />
          <input
            name="descricao"
            defaultValue={area.descricao ?? ""}
            placeholder="Descrição"
            className={CAMPO}
          />
          <button type="submit" className={BOTAO_PRIMARIO}>
            Salvar
          </button>
        </form>
      </details>
    </div>
  );
}
