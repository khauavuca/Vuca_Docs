import { Bug, CheckSquare, Sparkles, TrendingUp } from "lucide-react";
import type { TipoDeMudanca } from "@prisma/client";

/**
 * Mesmo agrupamento do relatório de Release Notes do Jira: os itens de
 * uma versão aparecem sempre nesta ordem e sob este rótulo, não na
 * ordem em que foram digitados.
 */
const ORDEM_DOS_TIPOS: TipoDeMudanca[] = ["NOVIDADE", "MELHORIA", "CORRECAO", "TAREFA"];

const RUBRICA_DO_TIPO: Record<TipoDeMudanca, { rotulo: string; icone: typeof Sparkles; cor: string }> = {
  NOVIDADE: { rotulo: "Novidades", icone: Sparkles, cor: "text-emerald-700" },
  MELHORIA: { rotulo: "Melhorias", icone: TrendingUp, cor: "text-blue-700" },
  CORRECAO: { rotulo: "Correções", icone: Bug, cor: "text-red-700" },
  TAREFA: { rotulo: "Outras alterações", icone: CheckSquare, cor: "text-slate-500" },
};

export type ItemDaNota = { id: string; tipo: TipoDeMudanca; texto: string };

export function CartaoDeNotaDeVersao({
  produto,
  versao,
  titulo,
  descricao,
  dataDeLancamento,
  publicada,
  itens,
}: {
  produto: string;
  versao: string;
  titulo?: string | null;
  descricao?: string | null;
  dataDeLancamento?: Date | null;
  publicada?: boolean;
  itens: ItemDaNota[];
}) {
  const porTipo = new Map<TipoDeMudanca, ItemDaNota[]>();
  for (const item of itens) {
    porTipo.set(item.tipo, [...(porTipo.get(item.tipo) ?? []), item]);
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-white">
          {produto}
        </span>
        <span className="font-mono text-sm font-semibold text-slate-900">v{versao}</span>
        {dataDeLancamento ? (
          <span className="text-xs text-slate-400">
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(dataDeLancamento)}
          </span>
        ) : null}
        {publicada === false ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            Rascunho
          </span>
        ) : null}
      </header>

      {titulo ? <h3 className="mb-1 font-medium text-slate-900">{titulo}</h3> : null}
      {descricao ? <p className="mb-3 text-sm text-slate-600">{descricao}</p> : null}

      <div className="space-y-3">
        {ORDEM_DOS_TIPOS.map((tipo) => {
          const doTipo = porTipo.get(tipo);
          if (!doTipo || doTipo.length === 0) return null;

          const { rotulo, icone: Icone, cor } = RUBRICA_DO_TIPO[tipo];

          return (
            <div key={tipo}>
              <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${cor}`}>
                <Icone aria-hidden className="size-3.5" />
                {rotulo}
              </p>
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-700">
                {doTipo.map((item) => (
                  <li key={item.id}>{item.texto}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </article>
  );
}
