import { NextResponse } from "next/server";

import {
  TAMANHO_MAXIMO_DE_ANEXO,
  TIPOS_DE_ANEXO_ACEITOS,
  guardarAnexo,
} from "@/lib/anexos";
import { podeEscrever } from "@/lib/sessao";
import { obterSessao } from "@/lib/sessaoServidor";

export const runtime = "nodejs";

/** Recebe a imagem enviada pelo editor e guarda no balde privado. */
export async function POST(requisicao: Request) {
  const sessao = await obterSessao();

  if (!sessao || !podeEscrever(sessao.papel)) {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  const formulario = await requisicao.formData();
  const arquivo = formulario.get("arquivo");

  if (!(arquivo instanceof File)) {
    return NextResponse.json({ erro: "Nenhum arquivo recebido." }, { status: 400 });
  }

  if (!TIPOS_DE_ANEXO_ACEITOS.has(arquivo.type)) {
    return NextResponse.json(
      { erro: "Formato não aceito. Envie imagem PNG, JPG, WEBP, GIF ou um PDF." },
      { status: 415 },
    );
  }

  if (arquivo.size > TAMANHO_MAXIMO_DE_ANEXO) {
    return NextResponse.json(
      { erro: "Arquivo grande demais. O limite é de 5 MB." },
      { status: 413 },
    );
  }

  try {
    const anexo = await guardarAnexo({
      conteudo: await arquivo.arrayBuffer(),
      nomeOriginal: arquivo.name,
      tipoMime: arquivo.type,
      enviadoPorId: sessao.id,
    });

    return NextResponse.json(anexo);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Falha ao enviar o arquivo.";
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
