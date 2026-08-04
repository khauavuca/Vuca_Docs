import type { Metadata } from "next";

import { EditorDeArtigo } from "@/components/EditorDeArtigo";
import { listarTipos, opcoesDeArea } from "@/lib/consultas";
import { podePublicar } from "@/lib/sessao";
import { exigirQuemEscreve } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Novo documento" };

/**
 * Esqueleto com que todo documento novo nasce. Padroniza não só a
 * aparência, mas a ordem em que a informação é apresentada: quem lê
 * encontra sempre a mesma coisa no mesmo lugar.
 */
const MODELO_PADRAO = `
<h2>Objetivo</h2>
<p>Explique em duas linhas o que este documento resolve.</p>
<h2>Quando usar</h2>
<p>Descreva a situação em que a equipe recorre a este documento.</p>
<h2>Antes de começar</h2>
<ul><li>Acesso, permissão ou informação necessária.</li></ul>
<h2>Passo a passo</h2>
<h3>1. Primeiro passo</h3>
<p>Descreva a ação e o que a pessoa deve ver na tela.</p>
<h3>2. Segundo passo</h3>
<p>Continue na mesma ordem em que a tarefa é executada.</p>
<h2>Como confirmar que deu certo</h2>
<p>O que precisa aparecer para a tarefa estar concluída.</p>
<h2>Problemas comuns</h2>
<p>Sintoma, causa e correção.</p>
`;

export default async function PaginaDeNovoDocumento() {
  const sessao = await exigirQuemEscreve();
  const [areas, tipos] = await Promise.all([opcoesDeArea(), listarTipos()]);

  return (
    <EditorDeArtigo
      artigo={{
        titulo: "",
        resumo: "",
        conteudoHtml: MODELO_PADRAO,
        areaId: "",
        tipoId: "",
        versaoSistema: "",
        marcadores: "",
      }}
      areas={areas}
      tipos={tipos.map((tipo) => ({ id: tipo.id, nome: tipo.nome }))}
      podePublicar={podePublicar(sessao.papel)}
    />
  );
}
