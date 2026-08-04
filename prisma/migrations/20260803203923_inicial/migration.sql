-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMINISTRADOR', 'REVISOR', 'AUTOR', 'COLABORADOR', 'LEITOR');

-- CreateEnum
CREATE TYPE "SituacaoArtigo" AS ENUM ('RASCUNHO', 'EM_REVISAO', 'PUBLICADO', 'DESATUALIZADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'LEITOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "tentativasFalhas" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoAte" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paiId" TEXT,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tipo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marcador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Marcador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artigo" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "resumo" TEXT,
    "conteudoHtml" TEXT NOT NULL DEFAULT '',
    "conteudoTexto" TEXT NOT NULL DEFAULT '',
    "buscaTexto" TEXT NOT NULL DEFAULT '',
    "situacao" "SituacaoArtigo" NOT NULL DEFAULT 'RASCUNHO',
    "versaoSistema" TEXT,
    "areaId" TEXT,
    "tipoId" TEXT,
    "autorId" TEXT,
    "revisorId" TEXT,
    "publicadoEm" TIMESTAMP(3),
    "revisadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artigo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersaoArtigo" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudoHtml" TEXT NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "artigoId" TEXT NOT NULL,
    "autorId" TEXT,

    CONSTRAINT "VersaoArtigo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anexo" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "artigoId" TEXT,
    "enviadoPorId" TEXT,

    CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtigoToMarcador" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtigoToMarcador_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_usuario_key" ON "Usuario"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Area_slug_key" ON "Area"("slug");

-- CreateIndex
CREATE INDEX "Area_paiId_idx" ON "Area"("paiId");

-- CreateIndex
CREATE UNIQUE INDEX "Tipo_slug_key" ON "Tipo"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Marcador_slug_key" ON "Marcador"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Artigo_slug_key" ON "Artigo"("slug");

-- CreateIndex
CREATE INDEX "Artigo_areaId_idx" ON "Artigo"("areaId");

-- CreateIndex
CREATE INDEX "Artigo_tipoId_idx" ON "Artigo"("tipoId");

-- CreateIndex
CREATE INDEX "Artigo_situacao_idx" ON "Artigo"("situacao");

-- CreateIndex
CREATE INDEX "VersaoArtigo_artigoId_idx" ON "VersaoArtigo"("artigoId");

-- CreateIndex
CREATE UNIQUE INDEX "Anexo_chave_key" ON "Anexo"("chave");

-- CreateIndex
CREATE INDEX "_ArtigoToMarcador_B_index" ON "_ArtigoToMarcador"("B");

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artigo" ADD CONSTRAINT "Artigo_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artigo" ADD CONSTRAINT "Artigo_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "Tipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artigo" ADD CONSTRAINT "Artigo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artigo" ADD CONSTRAINT "Artigo_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersaoArtigo" ADD CONSTRAINT "VersaoArtigo_artigoId_fkey" FOREIGN KEY ("artigoId") REFERENCES "Artigo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersaoArtigo" ADD CONSTRAINT "VersaoArtigo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_artigoId_fkey" FOREIGN KEY ("artigoId") REFERENCES "Artigo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtigoToMarcador" ADD CONSTRAINT "_ArtigoToMarcador_A_fkey" FOREIGN KEY ("A") REFERENCES "Artigo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtigoToMarcador" ADD CONSTRAINT "_ArtigoToMarcador_B_fkey" FOREIGN KEY ("B") REFERENCES "Marcador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
