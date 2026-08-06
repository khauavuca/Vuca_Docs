-- CreateTable
CREATE TABLE "ComentarioDeArtigo" (
    "id" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    "trecho" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidoEm" TIMESTAMP(3),
    "artigoId" TEXT NOT NULL,
    "autorId" TEXT,
    "resolvidoPorId" TEXT,

    CONSTRAINT "ComentarioDeArtigo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaDeComentario" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comentarioId" TEXT NOT NULL,
    "autorId" TEXT,

    CONSTRAINT "RespostaDeComentario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComentarioDeArtigo_marcaId_key" ON "ComentarioDeArtigo"("marcaId");

-- CreateIndex
CREATE INDEX "ComentarioDeArtigo_artigoId_idx" ON "ComentarioDeArtigo"("artigoId");

-- CreateIndex
CREATE INDEX "ComentarioDeArtigo_resolvido_idx" ON "ComentarioDeArtigo"("resolvido");

-- CreateIndex
CREATE INDEX "RespostaDeComentario_comentarioId_idx" ON "RespostaDeComentario"("comentarioId");

-- AddForeignKey
ALTER TABLE "ComentarioDeArtigo" ADD CONSTRAINT "ComentarioDeArtigo_artigoId_fkey" FOREIGN KEY ("artigoId") REFERENCES "Artigo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioDeArtigo" ADD CONSTRAINT "ComentarioDeArtigo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioDeArtigo" ADD CONSTRAINT "ComentarioDeArtigo_resolvidoPorId_fkey" FOREIGN KEY ("resolvidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaDeComentario" ADD CONSTRAINT "RespostaDeComentario_comentarioId_fkey" FOREIGN KEY ("comentarioId") REFERENCES "ComentarioDeArtigo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaDeComentario" ADD CONSTRAINT "RespostaDeComentario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
