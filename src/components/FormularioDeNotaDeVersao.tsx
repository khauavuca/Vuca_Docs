"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2 } from "lucide-react";

import {
  criarNotaDeVersao,
  type EstadoDaNotaDeVersao,
} from "@/actions/notasDeVersao";

const CAMPO =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

const TIPOS = [
  { valor: "NOVIDADE", rotulo: "Novidade" },
  { valor: "MELHORIA", rotulo: "Melhoria" },
  { valor: "CORRECAO", rotulo: "Correção" },
  { valor: "TAREFA", rotulo: "Outra alteração" },
];

let proximoId = 0;
function gerarId() {
  proximoId += 1;
  return proximoId;
}

type LinhaDeItem = { chave: number; tipo: string; texto: string };

function Botao({
  rotulo,
  estilo,
  aoClicar,
}: {
  rotulo: string;
  estilo: string;
  aoClicar: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      onClick={aoClicar}
      disabled={pending}
      className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 ${estilo}`}
    >
      {rotulo}
    </button>
  );
}

export function FormularioDeNotaDeVersao() {
  const [estado, acao] = useActionState<EstadoDaNotaDeVersao, FormData>(
    criarNotaDeVersao,
    {},
  );

  const [itens, setItens] = useState<LinhaDeItem[]>([
    { chave: gerarId(), tipo: "NOVIDADE", texto: "" },
  ]);

  // A ação viaja em um campo próprio, escrito no clique do botão — o
  // nome do botão que envia o formulário nem sempre chega certo ao
  // servidor (mesmo problema já visto no editor de artigos).
  const campoDeAcao = useRef<HTMLInputElement>(null);

  function escolherAcao(acao: "salvar" | "publicar") {
    if (campoDeAcao.current) campoDeAcao.current.value = acao;
  }

  function adicionarLinha() {
    setItens((atual) => [...atual, { chave: gerarId(), tipo: "NOVIDADE", texto: "" }]);
  }

  function removerLinha(chave: number) {
    setItens((atual) => (atual.length > 1 ? atual.filter((item) => item.chave !== chave) : atual));
  }

  function atualizarLinha(chave: number, campo: "tipo" | "texto", valor: string) {
    setItens((atual) =>
      atual.map((item) => (item.chave === chave ? { ...item, [campo]: valor } : item)),
    );
  }

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="acao" ref={campoDeAcao} defaultValue="salvar" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="produto" className="mb-1.5 block text-sm font-medium text-slate-700">
            Produto ou sistema
          </label>
          <input
            id="produto"
            name="produto"
            required
            placeholder="Vuca Totem, PDV, Retaguarda…"
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="versao" className="mb-1.5 block text-sm font-medium text-slate-700">
            Versão
          </label>
          <input id="versao" name="versao" required placeholder="2.5.4" className={CAMPO} />
        </div>

        <div>
          <label htmlFor="titulo" className="mb-1.5 block text-sm font-medium text-slate-700">
            Título (opcional)
          </label>
          <input
            id="titulo"
            name="titulo"
            placeholder="Ex: Atualização de meio de ano"
            className={CAMPO}
          />
        </div>

        <div>
          <label
            htmlFor="dataDeLancamento"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Data de lançamento
          </label>
          <input id="dataDeLancamento" name="dataDeLancamento" type="date" className={CAMPO} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="descricao" className="mb-1.5 block text-sm font-medium text-slate-700">
            Descrição (opcional)
          </label>
          <textarea
            id="descricao"
            name="descricao"
            rows={2}
            placeholder="Uma ou duas linhas sobre o que essa versão traz"
            className={CAMPO}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Itens da versão</p>

        <div className="space-y-2">
          {itens.map((item) => (
            <div key={item.chave} className="flex flex-col gap-2 sm:flex-row">
              <select
                name="itemTipo"
                value={item.tipo}
                onChange={(evento) => atualizarLinha(item.chave, "tipo", evento.target.value)}
                className={`${CAMPO} sm:w-44`}
              >
                {TIPOS.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.rotulo}
                  </option>
                ))}
              </select>

              <input
                name="itemTexto"
                value={item.texto}
                onChange={(evento) => atualizarLinha(item.chave, "texto", evento.target.value)}
                placeholder="O que mudou, em uma frase"
                className={`${CAMPO} flex-1`}
              />

              <button
                type="button"
                onClick={() => removerLinha(item.chave)}
                aria-label="Remover este item"
                className="rounded-lg border border-slate-300 bg-white px-2.5 text-slate-500 hover:bg-slate-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={adicionarLinha}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
        >
          <Plus aria-hidden className="size-4" />
          Adicionar item
        </button>
      </div>

      {estado.erro ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.erro}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Botao
          rotulo="Salvar rascunho"
          estilo="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          aoClicar={() => escolherAcao("salvar")}
        />
        <Botao
          rotulo="Publicar"
          estilo="bg-blue-700 text-white hover:bg-blue-800"
          aoClicar={() => escolherAcao("publicar")}
        />
      </div>
    </form>
  );
}
