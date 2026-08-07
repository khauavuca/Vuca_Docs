"use client";

import { useRef, useState } from "react";
import { FileUp } from "lucide-react";

import { criarApresentacao } from "@/actions/apresentacoes";

const CAMPO =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

/**
 * O deck já vem pronto (compilado fora da base). O formulário só pede um
 * título e o arquivo — nada de editor, porque o conteúdo não é feito
 * aqui dentro.
 */
export function FormularioDeApresentacao() {
  const [titulo, setTitulo] = useState("");
  const [anexoId, setAnexoId] = useState("");
  const [nomeDoArquivo, setNomeDoArquivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const campoDeArquivo = useRef<HTMLInputElement>(null);

  async function enviarArquivo(arquivo: File) {
    setErro(null);
    setEnviando(true);

    try {
      const corpo = new FormData();
      corpo.append("arquivo", arquivo);

      const resposta = await fetch("/api/apresentacoes", { method: "POST", body: corpo });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível enviar o arquivo.");
        return;
      }

      setAnexoId(dados.id);
      setNomeDoArquivo(arquivo.name);
      if (!titulo) setTitulo(arquivo.name.replace(/\.html?$/i, ""));
    } catch {
      setErro("Falha de conexão ao enviar o arquivo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form action={criarApresentacao} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <input type="hidden" name="anexoId" value={anexoId} />

      <div>
        <label htmlFor="titulo" className="mb-1.5 block text-sm font-medium text-slate-700">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          minLength={3}
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          placeholder="Ex: Retaguarda Vuca — versão 5.187"
          className={CAMPO}
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Arquivo do deck (.html)</span>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => campoDeArquivo.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileUp aria-hidden className="size-4" />
            {enviando ? "Enviando…" : "Escolher arquivo"}
          </button>

          {nomeDoArquivo ? <span className="text-sm text-slate-500">{nomeDoArquivo}</span> : null}
        </div>

        <input
          ref={campoDeArquivo}
          type="file"
          accept="text/html,.html"
          className="hidden"
          onChange={(evento) => {
            const arquivo = evento.target.files?.[0];
            if (arquivo) void enviarArquivo(arquivo);
          }}
        />
      </div>

      {erro ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!anexoId || enviando}
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
      >
        Salvar apresentação
      </button>
    </form>
  );
}
