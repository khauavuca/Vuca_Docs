import { Bug, CheckSquare, Sparkles, TrendingUp } from "lucide-react";
import type { TipoDeMudanca } from "@prisma/client";

/**
 * Mesmo agrupamento do relatório de Release Notes do Jira: os itens de
 * uma versão aparecem sempre nesta ordem e sob este rótulo, não na
 * ordem em que foram digitados.
 */
const ORDEM_DOS_TIPOS: TipoDeMudanca[] = ["NOVIDADE", "MELHORIA", "CORRECAO", "TAREFA"];

const RUBRICA_DO_TIPO: Record<
  TipoDeMudanca,
  { rotulo: string; icone: typeof Sparkles; cor: string; fundo: string }
> = {
  NOVIDADE: { rotulo: "Novidades", icone: Sparkles, cor: "text-emerald-800", fundo: "bg-emerald-50" },
  MELHORIA: { rotulo: "Melhorias", icone: TrendingUp, cor: "text-blue-800", fundo: "bg-blue-50" },
  CORRECAO: { rotulo: "Correções", icone: Bug, cor: "text-red-800", fundo: "bg-red-50" },
  TAREFA: { rotulo: "Outras alterações", icone: CheckSquare, cor: "text-slate-700", fundo: "bg-slate-100" },
};

export type ItemDaNota = { id: string; tipo: TipoDeMudanca; texto: string };

/**
 * Os itens costumam ser escritos como "Título — descrição". Separar
 * pelo travessão e destacar o título é o que faz uma lista de treze
 * correções ser escaneável, em vez de uma parede de texto corrido.
 */
function ItemDaLista({ texto }: { texto: string }) {
  const posicao = texto.indexOf(" — ");

  if (posicao < 0) {
    return <span>{texto}</span>;
  }

  return (
    <>
      <strong className="font-semibold text-slate-900">{texto.slice(0, posicao)}</strong>
      <span>{texto.slice(posicao)}</span>
    </>
  );
}

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
    <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
      <header className="mb-5 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-5">
        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-white">
          {produto}
        </span>
        <span className="font-mono text-lg font-bold text-slate-900">v{versao}</span>
        {dataDeLancamento ? (
          <span className="text-sm text-slate-500">
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(dataDeLancamento)}
          </span>
        ) : null}
        {publicada === false ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
            Rascunho
          </span>
        ) : null}
      </header>

      {titulo ? (
        <h3 className="mb-1.5 text-lg font-semibold text-slate-900">{titulo}</h3>
      ) : null}
      {descricao ? <p className="mb-6 text-base text-slate-600">{descricao}</p> : null}

      <div className="space-y-7">
        {ORDEM_DOS_TIPOS.map((tipo) => {
          const doTipo = porTipo.get(tipo);
          if (!doTipo || doTipo.length === 0) return null;

          const { rotulo, icone: Icone, cor, fundo } = RUBRICA_DO_TIPO[tipo];

          return (
            <div key={tipo}>
              <p
                className={`mb-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-bold uppercase tracking-wide ${cor} ${fundo}`}
              >
                <Icone aria-hidden className="size-4" />
                {rotulo}
              </p>
              <ul className="list-disc space-y-3 pl-5 text-[0.95rem] leading-relaxed text-slate-700">
                {doTipo.map((item) => (
                  <li key={item.id} className="pl-1">
                    <ItemDaLista texto={item.texto} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </article>
  );
}
