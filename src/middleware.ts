import { NextResponse, type NextRequest } from "next/server";

import { NOME_COOKIE, lerSessao } from "@/lib/sessao";

/**
 * A base é interna. Nada é acessível sem sessão, nem a página inicial,
 * nem as imagens. O middleware é a única porta de entrada.
 */
const CAMINHOS_LIVRES = ["/entrar"];

export async function middleware(requisicao: NextRequest) {
  const { pathname } = requisicao.nextUrl;
  const ehCaminhoLivre = CAMINHOS_LIVRES.some(
    (caminho) => pathname === caminho || pathname.startsWith(`${caminho}/`),
  );

  const sessao = await lerSessao(requisicao.cookies.get(NOME_COOKIE)?.value);

  if (!sessao && !ehCaminhoLivre) {
    const destino = requisicao.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.search = "";
    // Guarda para onde a pessoa queria ir, e volta para lá depois do login.
    if (pathname !== "/") destino.searchParams.set("destino", pathname);
    return NextResponse.redirect(destino);
  }

  // Senha definida por outra pessoa não abre a base: a conta só sai da
  // tela de troca depois de escolher uma senha que só ela conhece.
  if (
    sessao?.precisaTrocarSenha &&
    pathname !== "/conta/senha" &&
    !pathname.startsWith("/api/")
  ) {
    const destino = requisicao.nextUrl.clone();
    destino.pathname = "/conta/senha";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  if (sessao && ehCaminhoLivre) {
    const destino = requisicao.nextUrl.clone();
    destino.pathname = "/";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Tudo passa pelo middleware, menos os arquivos internos do Next.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};
