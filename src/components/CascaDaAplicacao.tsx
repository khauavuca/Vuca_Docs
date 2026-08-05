"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  FolderTree,
  LogOut,
  Megaphone,
  Menu,
  Rocket,
  Search,
  Settings,
  X,
} from "lucide-react";

import { sair } from "@/actions/autenticacao";
import type { DadosSessao } from "@/lib/sessao";

export type ItemDeMenu = {
  id: string;
  nome: string;
  slug: string;
  quantidade: number;
  filhas: Array<{ id: string; nome: string; slug: string; quantidade: number }>;
};

function CampoDeBusca() {
  const router = useRouter();
  const [termo, setTermo] = useState("");

  return (
    <form
      role="search"
      onSubmit={(evento) => {
        evento.preventDefault();
        const limpo = termo.trim();
        if (limpo.length > 1) router.push(`/busca?termo=${encodeURIComponent(limpo)}`);
      }}
      className="relative w-full max-w-xl"
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        placeholder="Buscar por erro, procedimento ou configuração"
        aria-label="Buscar na base de conhecimento"
        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
    </form>
  );
}

function Arvore({ areas, aoNavegar }: { areas: ItemDeMenu[]; aoNavegar: () => void }) {
  const caminho = usePathname();

  if (areas.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-slate-500">
        Nenhuma área criada ainda. Crie a primeira em Administração.
      </p>
    );
  }

  return (
    <nav aria-label="Áreas de conhecimento" className="space-y-1.5">
      {areas.map((area) => {
        const endereco = `/areas/${area.slug}`;
        const ativa = caminho === endereco;

        return (
          <div key={area.id}>
            <Link
              href={endereco}
              onClick={aoNavegar}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium transition ${
                ativa
                  ? "bg-blue-50 text-blue-800"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>{area.nome}</span>
              <span className="text-sm text-slate-400">{area.quantidade}</span>
            </Link>

            {area.filhas.length > 0 ? (
              <div className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-2">
                {area.filhas.map((filha) => {
                  const enderecoFilha = `/areas/${filha.slug}`;
                  const filhaAtiva = caminho === enderecoFilha;

                  return (
                    <Link
                      key={filha.id}
                      href={enderecoFilha}
                      onClick={aoNavegar}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-base transition ${
                        filhaAtiva
                          ? "bg-blue-50 text-blue-800"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <ChevronRight aria-hidden className="size-3.5 text-slate-300" />
                        {filha.nome}
                      </span>
                      <span className="text-sm text-slate-400">{filha.quantidade}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function CascaDaAplicacao({
  sessao,
  areas,
  podeAdministrarBase,
  podeEscreverConteudo,
  children,
}: {
  sessao: DadosSessao;
  areas: ItemDeMenu[];
  podeAdministrarBase: boolean;
  podeEscreverConteudo: boolean;
  children: React.ReactNode;
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const caminhoAtual = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white print:hidden">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-label={menuAberto ? "Fechar o menu" : "Abrir o menu"}
            aria-expanded={menuAberto}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            {menuAberto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight text-slate-900">
            Vuca <span className="text-blue-700">Docs</span>
          </Link>

          <div className="ml-2 hidden flex-1 justify-center sm:flex">
            <CampoDeBusca />
          </div>

          <div className="ml-auto flex items-center gap-1">
            {podeEscreverConteudo ? (
              <Link
                href="/admin"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:flex"
              >
                <Settings aria-hidden className="size-4" />
                Administração
              </Link>
            ) : null}

            <Link
              href="/conta/senha"
              title="Trocar a senha"
              className="hidden text-sm text-slate-500 hover:text-blue-700 md:inline"
            >
              {sessao.nome}
            </Link>

            <form action={sair}>
              <button
                type="submit"
                aria-label="Sair da base"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="px-4 pb-3 sm:hidden">
          <CampoDeBusca />
        </div>
      </header>

      <div className="mx-auto flex w-full gap-6 px-4 py-6 sm:px-6 print:p-0">
        <aside
          className={`${
            menuAberto ? "block" : "hidden"
          } w-full shrink-0 lg:block lg:w-72 print:hidden`}
        >
          <div className="sticky top-24">
            <Link
              href="/comunicados"
              onClick={() => setMenuAberto(false)}
              className={`mb-1.5 flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium transition ${
                caminhoAtual === "/comunicados"
                  ? "bg-blue-50 text-blue-800"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Megaphone aria-hidden className="size-5" />
              Comunicados
            </Link>

            <Link
              href="/notas-de-versao"
              onClick={() => setMenuAberto(false)}
              className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium transition ${
                caminhoAtual === "/notas-de-versao"
                  ? "bg-blue-50 text-blue-800"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Rocket aria-hidden className="size-5" />
              Notas de versão
            </Link>

            <p className="mb-2 flex items-center gap-1.5 px-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <FolderTree aria-hidden className="size-4" />
              Áreas
            </p>
            <Arvore areas={areas} aoNavegar={() => setMenuAberto(false)} />

            {podeAdministrarBase ? (
              <Link
                href="/admin/estrutura"
                className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-base text-slate-500 hover:bg-slate-100"
              >
                <Settings aria-hidden className="size-5" />
                Gerenciar áreas
              </Link>
            ) : null}
          </div>
        </aside>

        <main className={`${menuAberto ? "hidden" : "block"} min-w-0 flex-1 lg:block`}>
          {children}
        </main>
      </div>
    </div>
  );
}
