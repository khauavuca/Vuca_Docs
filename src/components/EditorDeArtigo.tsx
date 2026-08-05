"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Table2,
  Undo2,
  Video,
} from "lucide-react";

import { salvarArtigo, type EstadoDoArtigo } from "@/actions/artigos";
import { VideoDoDrive } from "@/components/extensaoVideoDrive";

export type OpcaoDeArea = { id: string; nome: string; nivel: number };
export type OpcaoDeTipo = { id: string; nome: string };

export type ArtigoParaEditar = {
  id?: string;
  titulo: string;
  resumo: string;
  conteudoHtml: string;
  areaId: string;
  tipoId: string;
  versaoSistema: string;
  marcadores: string;
};

function BotaoDaBarra({
  ativo,
  titulo,
  aoClicar,
  children,
}: {
  ativo?: boolean;
  titulo: string;
  aoClicar: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      onClick={aoClicar}
      className={`rounded p-2 transition ${
        ativo ? "bg-blue-100 text-blue-800" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function BotoesDeEnvio({
  podePublicar,
  escolherAcao,
}: {
  podePublicar: boolean;
  escolherAcao: (acao: "salvar" | "enviar_revisao" | "publicar") => void;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="submit"
        onClick={() => escolherAcao("salvar")}
        disabled={pending}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        Salvar rascunho
      </button>

      {/* Quem já pode publicar não precisa enviar o próprio documento
          para revisão — a etapa existe só para quem depende de outra
          pessoa aprovar antes de ir ao ar. */}
      {!podePublicar ? (
        <button
          type="submit"
          onClick={() => escolherAcao("enviar_revisao")}
          disabled={pending}
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-60"
        >
          Enviar para revisão
        </button>
      ) : null}

      {podePublicar ? (
        <button
          type="submit"
          onClick={() => escolherAcao("publicar")}
          disabled={pending}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "Publicando…" : "Publicar"}
        </button>
      ) : null}
    </div>
  );
}

export function EditorDeArtigo({
  artigo,
  areas,
  tipos,
  podePublicar,
}: {
  artigo: ArtigoParaEditar;
  areas: OpcaoDeArea[];
  tipos: OpcaoDeTipo[];
  podePublicar: boolean;
}) {
  const [estado, acao] = useActionState<EstadoDoArtigo, FormData>(salvarArtigo, {});
  const [conteudo, setConteudo] = useState(artigo.conteudoHtml);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [avisoDoEditor, setAvisoDoEditor] = useState<string | null>(null);
  const campoDeArquivo = useRef<HTMLInputElement>(null);

  // A ação viaja em um campo próprio, escrito no clique do botão. Depender
  // do nome do botão que enviou o formulário fazia toda publicação chegar
  // ao servidor como se fosse apenas salvar rascunho.
  const campoDeAcao = useRef<HTMLInputElement>(null);

  function escolherAcao(acao: "salvar" | "enviar_revisao" | "publicar") {
    if (campoDeAcao.current) campoDeAcao.current.value = acao;
  }

  const editor = useEditor({
    // Sem isto o Next tenta desenhar o editor no servidor e quebra.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Placeholder.configure({
        placeholder: "Escreva o passo a passo aqui…",
        emptyNodeClass: "esta-vazio",
      }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      VideoDoDrive,
    ],
    content: artigo.conteudoHtml,
    editorProps: {
      attributes: {
        class: "conteudo-artigo prose prose-slate max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor: instancia }) => setConteudo(instancia.getHTML()),
  });

  async function enviarImagem(arquivo: File) {
    setAvisoDoEditor(null);
    setEnviandoImagem(true);

    try {
      const corpo = new FormData();
      corpo.append("arquivo", arquivo);

      const resposta = await fetch("/api/anexos", { method: "POST", body: corpo });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setAvisoDoEditor(dados.erro ?? "Não foi possível enviar a imagem.");
        return;
      }

      editor?.chain().focus().setImage({ src: dados.endereco, alt: dados.nome }).run();
    } catch {
      setAvisoDoEditor("Falha de conexão ao enviar a imagem.");
    } finally {
      setEnviandoImagem(false);
      if (campoDeArquivo.current) campoDeArquivo.current.value = "";
    }
  }

  function inserirVideo() {
    const url = window.prompt(
      "Cole o link do vídeo no Google Drive.\nO vídeo precisa estar compartilhado com a equipe.",
    );
    if (!url) return;

    const identificador =
      url.match(/\/file\/d\/([^/]+)/)?.[1] ??
      new URLSearchParams(url.split("?")[1] ?? "").get("id");

    if (!identificador || !url.includes("drive.google.com")) {
      setAvisoDoEditor("Só é aceito link de vídeo do Google Drive.");
      return;
    }

    editor
      ?.chain()
      .focus()
      .insertContent({
        type: "videoDoDrive",
        attrs: { url: `https://drive.google.com/file/d/${identificador}/preview` },
      })
      .run();
  }

  function inserirLink() {
    const url = window.prompt("Endereço do link (comece com https://)");
    if (!url) return;
    if (!url.startsWith("https://")) {
      setAvisoDoEditor("O link precisa começar com https://");
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <form action={acao} className="space-y-6">
      {artigo.id ? <input type="hidden" name="id" value={artigo.id} /> : null}
      <input type="hidden" name="conteudoHtml" value={conteudo} />
      <input type="hidden" name="acao" ref={campoDeAcao} defaultValue="salvar" />

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="titulo" className="mb-1.5 block text-sm font-medium text-slate-700">
            Título
          </label>
          <input
            id="titulo"
            name="titulo"
            defaultValue={artigo.titulo}
            required
            placeholder="Use o termo que a pessoa digitaria na busca"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="resumo" className="mb-1.5 block text-sm font-medium text-slate-700">
            Resumo
          </label>
          <input
            id="resumo"
            name="resumo"
            defaultValue={artigo.resumo}
            placeholder="Uma linha explicando o que este documento resolve"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label htmlFor="areaId" className="mb-1.5 block text-sm font-medium text-slate-700">
            Área
          </label>
          <select
            id="areaId"
            name="areaId"
            defaultValue={artigo.areaId}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
          >
            <option value="">Sem área</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nivel > 0 ? `— ${area.nome}` : area.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tipoId" className="mb-1.5 block text-sm font-medium text-slate-700">
            Tipo de documento
          </label>
          <select
            id="tipoId"
            name="tipoId"
            defaultValue={artigo.tipoId}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
          >
            <option value="">Sem tipo</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="marcadores" className="mb-1.5 block text-sm font-medium text-slate-700">
            Marcadores
          </label>
          <input
            id="marcadores"
            name="marcadores"
            defaultValue={artigo.marcadores}
            placeholder="impressora, instalação, erro"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-xs text-slate-500">Separe por vírgula.</p>
        </div>

        <div>
          <label
            htmlFor="versaoSistema"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Versão do sistema
          </label>
          <input
            id="versaoSistema"
            name="versaoSistema"
            defaultValue={artigo.versaoSistema}
            placeholder="Opcional"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Sem overflow-hidden aqui: essa propriedade em qualquer ancestral
          impede o filho de grudar com "sticky" — foi por isso que a
          barra abaixo nunca chegou a ficar fixa de verdade. */}
      <div className="rounded-xl border border-slate-200 bg-white">
        {/* Presa logo abaixo do cabeçalho da aplicação: num documento
            longo, ninguém deveria precisar rolar até o topo só para
            aplicar uma formatação. */}
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-slate-200 bg-slate-50/95 p-1.5 backdrop-blur">
          <BotaoDaBarra
            titulo="Negrito"
            ativo={editor?.isActive("bold")}
            aoClicar={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra
            titulo="Itálico"
            ativo={editor?.isActive("italic")}
            aoClicar={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </BotaoDaBarra>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          <BotaoDaBarra
            titulo="Título principal"
            ativo={editor?.isActive("heading", { level: 1 })}
            aoClicar={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra
            titulo="Título de seção"
            ativo={editor?.isActive("heading", { level: 2 })}
            aoClicar={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra
            titulo="Subtítulo"
            ativo={editor?.isActive("heading", { level: 3 })}
            aoClicar={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="size-4" />
          </BotaoDaBarra>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          <BotaoDaBarra
            titulo="Lista"
            ativo={editor?.isActive("bulletList")}
            aoClicar={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra
            titulo="Lista numerada"
            ativo={editor?.isActive("orderedList")}
            aoClicar={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra
            titulo="Bloco de destaque"
            ativo={editor?.isActive("blockquote")}
            aoClicar={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra
            titulo="Bloco de código"
            ativo={editor?.isActive("codeBlock")}
            aoClicar={() => editor?.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 className="size-4" />
          </BotaoDaBarra>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          <BotaoDaBarra
            titulo="Tabela"
            aoClicar={() =>
              editor
                ?.chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <Table2 className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra titulo="Link" ativo={editor?.isActive("link")} aoClicar={inserirLink}>
            <Link2 className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra
            titulo={enviandoImagem ? "Enviando imagem…" : "Imagem"}
            aoClicar={() => campoDeArquivo.current?.click()}
          >
            <ImagePlus className={`size-4 ${enviandoImagem ? "animate-pulse" : ""}`} />
          </BotaoDaBarra>
          <BotaoDaBarra titulo="Vídeo do Google Drive" aoClicar={inserirVideo}>
            <Video className="size-4" />
          </BotaoDaBarra>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          <BotaoDaBarra titulo="Desfazer" aoClicar={() => editor?.chain().focus().undo().run()}>
            <Undo2 className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra titulo="Refazer" aoClicar={() => editor?.chain().focus().redo().run()}>
            <Redo2 className="size-4" />
          </BotaoDaBarra>

          <input
            ref={campoDeArquivo}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            className="hidden"
            onChange={(evento) => {
              const arquivo = evento.target.files?.[0];
              if (arquivo) void enviarImagem(arquivo);
            }}
          />
        </div>

        <div className="p-4">
          <EditorContent editor={editor} />
        </div>
      </div>

      {avisoDoEditor ? (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {avisoDoEditor}
        </p>
      ) : null}

      {estado.erro ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.erro}
        </p>
      ) : null}

      {/* Fixa embaixo da tela: num documento longo, ninguém deveria
          precisar rolar até o fim só para salvar ou publicar. */}
      <div className="sticky bottom-0 z-20 -mb-6 border-t border-slate-200 bg-white/95 py-3 backdrop-blur">
        <BotoesDeEnvio podePublicar={podePublicar} escolherAcao={escolherAcao} />
      </div>
    </form>
  );
}
