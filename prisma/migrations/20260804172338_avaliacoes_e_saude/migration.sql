-- CreateTable
CREATE TABLE "AvaliacaoDeArtigo" (
    "id" TEXT NOT NULL,
    "resolveu" BOOLEAN NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "artigoId" TEXT NOT NULL,
    "usuarioId" TEXT,

    CONSTRAINT "AvaliacaoDeArtigo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuscaSemResultado" (
    "id" TEXT NOT NULL,
    "termo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuscaSemResultado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvaliacaoDeArtigo_artigoId_idx" ON "AvaliacaoDeArtigo"("artigoId");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoDeArtigo_artigoId_usuarioId_key" ON "AvaliacaoDeArtigo"("artigoId", "usuarioId");

-- CreateIndex
CREATE INDEX "BuscaSemResultado_criadoEm_idx" ON "BuscaSemResultado"("criadoEm");

-- AddForeignKey
ALTER TABLE "AvaliacaoDeArtigo" ADD CONSTRAINT "AvaliacaoDeArtigo_artigoId_fkey" FOREIGN KEY ("artigoId") REFERENCES "Artigo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoDeArtigo" ADD CONSTRAINT "AvaliacaoDeArtigo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
