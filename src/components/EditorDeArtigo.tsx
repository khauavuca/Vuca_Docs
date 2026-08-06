"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import UnderlineExtensao from "@tiptap/extension-underline";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignVerticalSpaceAround,
  Baseline,
  Bold,
  Check,
  ChevronDown,
  Code2,
  Highlighter,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  MessageSquarePlus,
  Minus,
  Plus,
  Quote,
  Redo2,
  RemoveFormatting,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
  Video,
} from "lucide-react";

import {
  criarComentario,
  reabrirComentario,
  responderComentario,
  resolverComentario,
} from "@/actions/comentarios";
import { salvarArtigo, type EstadoDoArtigo } from "@/actions/artigos";
import { VideoDoDrive } from "@/components/extensaoVideoDrive";
import {
  EspacamentoDeLinha,
  Indentacao,
  MarcaDeComentario,
  TamanhoDeFonte,
} from "@/components/extensoesDeFormatacao";

export type OpcaoDeArea = { id: string; nome: string; nivel: number };
export type OpcaoDeTipo = { id: string; nome: string };

export type AutorDoComentario = { nome: string } | null;

export type RespostaParaEditor = {
  id: string;
  texto: string;
  criadoEm: Date;
  autor: AutorDoComentario;
};

export type ComentarioParaEditor = {
  id: string;
  marcaId: string;
  trecho: string;
  texto: string;
  resolvido: boolean;
  criadoEm: Date;
  autor: AutorDoComentario;
  resolvidoPor: AutorDoComentario;
  respostas: RespostaParaEditor[];
};

export type ArtigoParaEditar = {
  id?: string;
  titulo: string;
  resumo: string;
  conteudoHtml: string;
  areaId: string;
  tipoId: string;
  versaoSistema: string;
  marcadores: string;
  imagemDeFundo: string;
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

function SeletorDaBarra({
  titulo,
  valor,
  opcoes,
  aoMudar,
  className,
}: {
  titulo: string;
  valor: string;
  opcoes: Array<{ valor: string; rotulo: string }>;
  aoMudar: (valor: string) => void;
  className?: string;
}) {
  return (
    <select
      title={titulo}
      aria-label={titulo}
      value={valor}
      onChange={(evento) => aoMudar(evento.target.value)}
      className={`rounded border-none bg-transparent px-1 py-1.5 text-sm text-slate-700 outline-none hover:bg-slate-100 focus:bg-slate-100 ${className ?? ""}`}
    >
      {opcoes.map((opcao) => (
        <option key={opcao.valor} value={opcao.valor}>
          {opcao.rotulo}
        </option>
      ))}
    </select>
  );
}

function SeletorDeCor({
  titulo,
  icone,
  paleta,
  valorAtual,
  aoEscolher,
  aoLimpar,
}: {
  titulo: string;
  icone: React.ReactNode;
  paleta: string[];
  valorAtual: string;
  aoEscolher: (cor: string) => void;
  aoLimpar?: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const referencia = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (referencia.current && !referencia.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  return (
    <div ref={referencia} className="relative">
      <button
        type="button"
        title={titulo}
        aria-label={titulo}
        onClick={() => setAberto((atual) => !atual)}
        className="rounded p-2 text-slate-600 hover:bg-slate-100"
      >
        {icone}
      </button>

      {aberto ? (
        <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg">
          {aoLimpar ? (
            <button
              type="button"
              onClick={() => {
                aoLimpar();
                setAberto(false);
              }}
              className="mb-2 flex w-full items-center gap-2 rounded px-1.5 py-1 text-sm text-slate-600 hover:bg-slate-100"
            >
              <span className="relative flex size-4 items-center justify-center rounded-full border border-slate-300">
                <span className="absolute h-full w-px rotate-45 bg-red-500" />
              </span>
              Nenhuma
            </button>
          ) : null}

          <div className="grid grid-cols-5 gap-1.5">
            {paleta.map((cor) => (
              <button
                key={cor}
                type="button"
                title={cor}
                onClick={() => {
                  aoEscolher(cor);
                  setAberto(false);
                }}
                className={`size-6 rounded-full border ${
                  valorAtual === cor ? "ring-2 ring-blue-500 ring-offset-1" : "border-slate-200"
                }`}
                style={{ backgroundColor: cor }}
              />
            ))}
          </div>

          <label className="mt-2 flex cursor-pointer items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500 hover:text-slate-700">
            Cor personalizada
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(valorAtual) ? valorAtual : "#000000"}
              onChange={(evento) => aoEscolher(evento.target.value)}
              className="size-5 cursor-pointer rounded border border-slate-300 p-0"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function SeletorDeTamanho({
  titulo,
  valor,
  aoMudar,
  minimo = 8,
  maximo = 96,
  passo = 1,
}: {
  titulo: string;
  valor: number;
  aoMudar: (valor: number) => void;
  minimo?: number;
  maximo?: number;
  passo?: number;
}) {
  const [rascunho, setRascunho] = useState(String(valor));

  useEffect(() => {
    setRascunho(String(valor));
  }, [valor]);

  function aplicar(novoValor: number) {
    aoMudar(Math.min(maximo, Math.max(minimo, novoValor)));
  }

  return (
    <div title={titulo} className="flex items-center gap-0.5 rounded px-0.5">
      <button
        type="button"
        aria-label="Diminuir tamanho da fonte"
        onClick={() => aplicar(valor - passo)}
        className="rounded p-1 text-slate-600 hover:bg-slate-100"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        aria-label={titulo}
        value={rascunho}
        onChange={(evento) => setRascunho(evento.target.value)}
        onBlur={() => {
          const numero = Number(rascunho.replace(",", "."));
          aplicar(Number.isFinite(numero) && numero > 0 ? numero : valor);
        }}
        onKeyDown={(evento) => {
          if (evento.key === "Enter") evento.currentTarget.blur();
        }}
        className="w-10 rounded border border-transparent bg-transparent px-1 py-1 text-center text-sm text-slate-700 outline-none hover:border-slate-200 focus:border-slate-300"
      />
      <button
        type="button"
        aria-label="Aumentar tamanho da fonte"
        onClick={() => aplicar(valor + passo)}
        className="rounded p-1 text-slate-600 hover:bg-slate-100"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function MenuDaBarra({
  titulo,
  icone,
  valor,
  opcoes,
  aoEscolher,
}: {
  titulo: string;
  icone: React.ReactNode;
  valor: string;
  opcoes: Array<{ valor: string; rotulo: string }>;
  aoEscolher: (valor: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const referencia = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (referencia.current && !referencia.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  return (
    <div ref={referencia} className="relative">
      <button
        type="button"
        title={titulo}
        aria-label={titulo}
        onClick={() => setAberto((atual) => !atual)}
        className="flex items-center gap-0.5 rounded p-2 text-slate-600 hover:bg-slate-100"
      >
        {icone}
        <ChevronDown className="size-3" />
      </button>

      {aberto ? (
        <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {opcoes.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => {
                aoEscolher(opcao.valor);
                setAberto(false);
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              <Check
                className={`size-3.5 shrink-0 ${valor === opcao.valor ? "opacity-100" : "opacity-0"}`}
              />
              {opcao.rotulo}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const formatarDataHora = (data: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data);

function PainelDeComentarios({
  comentarios,
  aoResponder,
  aoResolver,
  aoReabrir,
}: {
  comentarios: ComentarioParaEditor[];
  aoResponder: (comentarioId: string, texto: string) => void;
  aoResolver: (comentarioId: string) => void;
  aoReabrir: (comentarioId: string) => void;
}) {
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});

  if (comentarios.length === 0) return null;

  const abertos = comentarios.filter((comentario) => !comentario.resolvido);
  const resolvidos = comentarios.filter((comentario) => comentario.resolvido);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">
        Comentários
        {abertos.length > 0 ? ` — ${abertos.length} em aberto` : " — tudo resolvido"}
      </h2>

      <ul className="space-y-3">
        {[...abertos, ...resolvidos].map((comentario) => (
          <li
            key={comentario.id}
            className={`rounded-lg border p-3 ${
              comentario.resolvido
                ? "border-slate-200 bg-slate-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="text-xs italic text-slate-500">"{comentario.trecho}"</p>
            <p className="mt-1 text-sm text-slate-800">
              <strong>{comentario.autor?.nome ?? "Alguém"}</strong> · {comentario.texto}
            </p>

            {comentario.respostas.map((resposta) => (
              <p
                key={resposta.id}
                className="ml-3 mt-1.5 border-l-2 border-slate-200 pl-2 text-sm text-slate-700"
              >
                <strong>{resposta.autor?.nome ?? "Alguém"}</strong> · {resposta.texto}
              </p>
            ))}

            {comentario.resolvido ? (
              <p className="mt-1.5 text-xs text-slate-500">
                Resolvido por {comentario.resolvidoPor?.nome ?? "alguém"}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={rascunhos[comentario.id] ?? ""}
                onChange={(evento) =>
                  setRascunhos((atual) => ({ ...atual, [comentario.id]: evento.target.value }))
                }
                placeholder="Responder…"
                className="min-w-40 flex-1 rounded border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={() => {
                  const texto = (rascunhos[comentario.id] ?? "").trim();
                  if (!texto) return;
                  aoResponder(comentario.id, texto);
                  setRascunhos((atual) => ({ ...atual, [comentario.id]: "" }));
                }}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Responder
              </button>
              {comentario.resolvido ? (
                <button
                  type="button"
                  onClick={() => aoReabrir(comentario.id)}
                  className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Reabrir
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => aoResolver(comentario.id)}
                  className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-100"
                >
                  Marcar como resolvido
                </button>
              )}
            </div>

            <p className="mt-1.5 text-xs text-slate-400">{formatarDataHora(comentario.criadoEm)}</p>
          </li>
        ))}
      </ul>
    </div>
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
  comentarios: comentariosIniciais,
}: {
  artigo: ArtigoParaEditar;
  areas: OpcaoDeArea[];
  tipos: OpcaoDeTipo[];
  podePublicar: boolean;
  comentarios: ComentarioParaEditor[];
}) {
  const [estado, acao] = useActionState<EstadoDoArtigo, FormData>(salvarArtigo, {});
  const [conteudo, setConteudo] = useState(artigo.conteudoHtml);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [avisoDoEditor, setAvisoDoEditor] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<ComentarioParaEditor[]>(comentariosIniciais);
  const [imagemDeFundo, setImagemDeFundo] = useState(artigo.imagemDeFundo);
  const [enviandoFundo, setEnviandoFundo] = useState(false);
  const campoDeArquivo = useRef<HTMLInputElement>(null);
  const campoDeArquivoDeFundo = useRef<HTMLInputElement>(null);

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
      UnderlineExtensao,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      FontFamily,
      TamanhoDeFonte,
      Highlight.configure({ multicolor: true }),
      Indentacao,
      EspacamentoDeLinha,
      MarcaDeComentario,
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

  async function enviarImagemDeFundo(arquivo: File) {
    setAvisoDoEditor(null);
    setEnviandoFundo(true);

    try {
      const corpo = new FormData();
      corpo.append("arquivo", arquivo);

      const resposta = await fetch("/api/anexos", { method: "POST", body: corpo });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setAvisoDoEditor(dados.erro ?? "Não foi possível enviar a imagem de fundo.");
        return;
      }

      setImagemDeFundo(dados.endereco);
    } catch {
      setAvisoDoEditor("Falha de conexão ao enviar a imagem de fundo.");
    } finally {
      setEnviandoFundo(false);
      if (campoDeArquivoDeFundo.current) campoDeArquivoDeFundo.current.value = "";
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

  async function adicionarComentario() {
    if (!artigo.id) {
      setAvisoDoEditor("Salve o documento antes de adicionar comentários.");
      return;
    }
    if (!editor || editor.state.selection.empty) {
      setAvisoDoEditor("Selecione um trecho de texto para comentar.");
      return;
    }

    const texto = window.prompt("Escreva o comentário:");
    if (!texto || texto.trim().length < 2) return;

    const { from, to } = editor.state.selection;
    const trecho = editor.state.doc.textBetween(from, to, " ").slice(0, 300);
    const marcaId = crypto.randomUUID();

    editor.chain().focus().marcarComentario(marcaId).run();

    try {
      const comentario = await criarComentario({ artigoId: artigo.id, marcaId, trecho, texto });
      setComentarios((atual) => [...atual, comentario]);
    } catch {
      setAvisoDoEditor("Não foi possível salvar o comentário.");
    }
  }

  async function responderComentarioHandler(comentarioId: string, texto: string) {
    try {
      const resposta = await responderComentario({ comentarioId, texto });
      setComentarios((atual) =>
        atual.map((comentario) =>
          comentario.id === comentarioId
            ? { ...comentario, respostas: [...comentario.respostas, resposta] }
            : comentario,
        ),
      );
    } catch {
      setAvisoDoEditor("Não foi possível enviar a resposta.");
    }
  }

  async function resolverComentarioHandler(comentarioId: string) {
    try {
      const atualizado = await resolverComentario(comentarioId);
      setComentarios((atual) =>
        atual.map((comentario) => (comentario.id === comentarioId ? atualizado : comentario)),
      );
    } catch {
      setAvisoDoEditor("Não foi possível marcar como resolvido.");
    }
  }

  async function reabrirComentarioHandler(comentarioId: string) {
    try {
      const atualizado = await reabrirComentario(comentarioId);
      setComentarios((atual) =>
        atual.map((comentario) => (comentario.id === comentarioId ? atualizado : comentario)),
      );
    } catch {
      setAvisoDoEditor("Não foi possível reabrir o comentário.");
    }
  }

  function aumentarRecuo() {
    if (!editor) return;
    if (editor.isActive("listItem")) editor.chain().focus().sinkListItem("listItem").run();
    else editor.chain().focus().aumentarRecuo().run();
  }

  function diminuirRecuo() {
    if (!editor) return;
    if (editor.isActive("listItem")) editor.chain().focus().liftListItem("listItem").run();
    else editor.chain().focus().diminuirRecuo().run();
  }

  function aplicarEstilo(valor: string) {
    if (valor === "paragrafo") editor?.chain().focus().setParagraph().run();
    else editor?.chain().focus().setHeading({ level: Number(valor) as 1 | 2 | 3 }).run();
  }

  const estiloAtual = editor?.isActive("heading", { level: 1 })
    ? "1"
    : editor?.isActive("heading", { level: 2 })
      ? "2"
      : editor?.isActive("heading", { level: 3 })
        ? "3"
        : "paragrafo";

  const OPCOES_DE_FONTE = [
    { valor: "", rotulo: "Fonte padrão" },
    { valor: "Arial, sans-serif", rotulo: "Arial" },
    { valor: "Georgia, serif", rotulo: "Georgia" },
    { valor: '"Times New Roman", serif', rotulo: "Times New Roman" },
    { valor: '"Courier New", monospace', rotulo: "Courier New" },
    { valor: "Verdana, sans-serif", rotulo: "Verdana" },
  ];

  const OPCOES_DE_ESPACAMENTO = [
    { valor: "1", rotulo: "Simples" },
    { valor: "1.15", rotulo: "1,15" },
    { valor: "1.5", rotulo: "1,5" },
    { valor: "2", rotulo: "Duplo" },
  ];

  const PALETA_DE_COR_DE_TEXTO = [
    "#0f172a", "#334155", "#64748b", "#94a3b8", "#ffffff",
    "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2", "#2563eb", "#7c3aed", "#db2777",
  ];

  const PALETA_DE_DESTAQUE = [
    "#fef08a", "#fde68a", "#fed7aa", "#fecaca", "#bbf7d0",
    "#a5f3fc", "#bfdbfe", "#e9d5ff", "#fbcfe8", "#ffffff",
  ];

  function aplicarFonte(valor: string) {
    if (valor) editor?.chain().focus().setFontFamily(valor).run();
    else editor?.chain().focus().unsetFontFamily().run();
  }

  const tamanhoDeFonteAtual = (() => {
    const bruto = editor?.getAttributes("textStyle").fontSize as string | undefined;
    const numero = bruto ? parseFloat(bruto) : NaN;
    return Number.isFinite(numero) ? numero : 16;
  })();

  function aplicarTamanho(valor: number) {
    editor?.chain().focus().definirTamanhoDeFonte(`${valor}px`).run();
  }

  function aplicarEspacamento(valor: string) {
    editor?.chain().focus().definirEspacamentoDeLinha(valor).run();
  }

  function aplicarCorDeTexto(cor: string) {
    editor?.chain().focus().setColor(cor).run();
  }

  function aplicarCorDeDestaque(cor: string) {
    editor?.chain().focus().setHighlight({ color: cor }).run();
  }

  return (
    <form action={acao} className="space-y-6">
      {artigo.id ? <input type="hidden" name="id" value={artigo.id} /> : null}
      <input type="hidden" name="conteudoHtml" value={conteudo} />
      <input type="hidden" name="imagemDeFundo" value={imagemDeFundo} />
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

        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Imagem de fundo da página
          </span>
          <p className="mb-2 text-xs text-slate-500">
            Foge do padrão único da base — use só quando este documento
            específico precisar se destacar (uma capa, um convite).
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {imagemDeFundo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagemDeFundo}
                alt=""
                className="h-16 w-28 rounded-lg border border-slate-200 object-cover"
              />
            ) : null}

            <button
              type="button"
              onClick={() => campoDeArquivoDeFundo.current?.click()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              {enviandoFundo
                ? "Enviando…"
                : imagemDeFundo
                  ? "Trocar imagem"
                  : "Escolher imagem"}
            </button>

            {imagemDeFundo ? (
              <button
                type="button"
                onClick={() => setImagemDeFundo("")}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Remover
              </button>
            ) : null}

            <input
              ref={campoDeArquivoDeFundo}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(evento) => {
                const arquivo = evento.target.files?.[0];
                if (arquivo) void enviarImagemDeFundo(arquivo);
              }}
            />
          </div>
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
          <SeletorDaBarra
            titulo="Estilo do parágrafo"
            valor={estiloAtual}
            aoMudar={aplicarEstilo}
            opcoes={[
              { valor: "paragrafo", rotulo: "Texto normal" },
              { valor: "1", rotulo: "Título 1" },
              { valor: "2", rotulo: "Título 2" },
              { valor: "3", rotulo: "Título 3" },
            ]}
          />
          <SeletorDaBarra
            titulo="Fonte"
            valor={editor?.getAttributes("textStyle").fontFamily ?? ""}
            aoMudar={aplicarFonte}
            opcoes={OPCOES_DE_FONTE}
            className="max-w-32"
          />
          <SeletorDeTamanho
            titulo="Tamanho da fonte"
            valor={tamanhoDeFonteAtual}
            aoMudar={aplicarTamanho}
          />

          <span className="mx-1 h-5 w-px bg-slate-200" />

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
          <BotaoDaBarra
            titulo="Sublinhado"
            ativo={editor?.isActive("underline")}
            aoClicar={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="size-4" />
          </BotaoDaBarra>

          <SeletorDeCor
            titulo="Cor do texto"
            icone={<Baseline className="size-4" />}
            paleta={PALETA_DE_COR_DE_TEXTO}
            valorAtual={editor?.getAttributes("textStyle").color ?? ""}
            aoEscolher={aplicarCorDeTexto}
            aoLimpar={() => editor?.chain().focus().unsetColor().run()}
          />
          <SeletorDeCor
            titulo="Cor de destaque"
            icone={<Highlighter className="size-4" />}
            paleta={PALETA_DE_DESTAQUE}
            valorAtual={editor?.getAttributes("highlight").color ?? ""}
            aoEscolher={aplicarCorDeDestaque}
            aoLimpar={() => editor?.chain().focus().unsetHighlight().run()}
          />
          <BotaoDaBarra
            titulo="Limpar formatação"
            aoClicar={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            <RemoveFormatting className="size-4" />
          </BotaoDaBarra>

          <span className="mx-1 h-5 w-px bg-slate-200" />

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
          <BotaoDaBarra titulo="Adicionar comentário" aoClicar={adicionarComentario}>
            <MessageSquarePlus className="size-4" />
          </BotaoDaBarra>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          <BotaoDaBarra
            titulo="Alinhar à esquerda"
            ativo={editor?.isActive({ textAlign: "left" })}
            aoClicar={() => editor?.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra
            titulo="Centralizar"
            ativo={editor?.isActive({ textAlign: "center" })}
            aoClicar={() => editor?.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra
            titulo="Alinhar à direita"
            ativo={editor?.isActive({ textAlign: "right" })}
            aoClicar={() => editor?.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra
            titulo="Justificar"
            ativo={editor?.isActive({ textAlign: "justify" })}
            aoClicar={() => editor?.chain().focus().setTextAlign("justify").run()}
          >
            <AlignJustify className="size-4" />
          </BotaoDaBarra>
          <MenuDaBarra
            titulo="Espaçamento entre linhas"
            icone={<AlignVerticalSpaceAround className="size-4" />}
            valor={
              editor?.getAttributes("paragraph").espacamentoDeLinha ??
              editor?.getAttributes("heading").espacamentoDeLinha ??
              "1"
            }
            aoEscolher={aplicarEspacamento}
            opcoes={OPCOES_DE_ESPACAMENTO}
          />
          <BotaoDaBarra titulo="Diminuir recuo" aoClicar={diminuirRecuo}>
            <IndentDecrease className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra titulo="Aumentar recuo" aoClicar={aumentarRecuo}>
            <IndentIncrease className="size-4" />
          </BotaoDaBarra>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          <BotaoDaBarra
            titulo="Lista de verificação"
            ativo={editor?.isActive("taskList")}
            aoClicar={() => editor?.chain().focus().toggleTaskList().run()}
          >
            <ListTodo className="size-4" />
          </BotaoDaBarra>
          <BotaoDaBarra
            titulo="Lista com marcadores"
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

      <PainelDeComentarios
        comentarios={comentarios}
        aoResponder={responderComentarioHandler}
        aoResolver={resolverComentarioHandler}
        aoReabrir={reabrirComentarioHandler}
      />

      {/* Fixa embaixo da tela: num documento longo, ninguém deveria
          precisar rolar até o fim só para salvar ou publicar. */}
      <div className="sticky bottom-0 z-20 -mb-6 border-t border-slate-200 bg-white/95 py-3 backdrop-blur">
        <BotoesDeEnvio podePublicar={podePublicar} escolherAcao={escolherAcao} />
      </div>
    </form>
  );
}
