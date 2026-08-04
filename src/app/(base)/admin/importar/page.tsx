import type { Metadata } from "next";

import { FormularioDeImportacao } from "@/components/FormularioDeImportacao";
import { listarTipos, opcoesDeArea } from "@/lib/consultas";
import { exigirQuemEscreve } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Importar do Word" };

export default async function PaginaDeImportacao() {
  await exigirQuemEscreve();
  const [areas, tipos] = await Promise.all([opcoesDeArea(), listarTipos()]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-1 font-medium text-slate-900">
          Trazer um documento que já existe
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          O arquivo é convertido e entra como rascunho, para você revisar
          antes de publicar. Nada vai ao ar automaticamente.
        </p>

        <FormularioDeImportacao
          areas={areas}
          tipos={tipos.map((tipo) => ({ id: tipo.id, nome: tipo.nome }))}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <h3 className="mb-2 font-medium text-slate-900">O que esperar da conversão</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Word:</strong> títulos, listas, tabelas e formatação são
            mantidos, e as figuras vêm no lugar em que estão no texto.
          </li>
          <li>
            <strong>PDF:</strong> o texto é recuperado e a estrutura é
            deduzida da numeração das seções. As figuras vêm em uma seção
            no fim, para você posicionar, porque o formato não guarda a
            ligação entre imagem e parágrafo.
          </li>
          <li>
            Toda figura passa a ser servida pela plataforma, protegida por
            login como qualquer imagem daqui.
          </li>
          <li>
            Capa, cabeçalho e rodapé do arquivo não são importados. Eles são
            gerados pela plataforma, no padrão único de todos os documentos.
          </li>
          <li>
            Se o documento reunir assuntos diferentes, o melhor é dividi-lo
            em mais de um artigo depois de importar.
          </li>
        </ul>
      </section>
    </div>
  );
}
