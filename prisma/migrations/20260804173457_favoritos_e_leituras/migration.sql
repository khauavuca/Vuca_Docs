-- CreateTable
CREATE TABLE "Favorito" (
    "id" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "artigoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeituraDeArtigo" (
    "id" TEXT NOT NULL,
    "vezes" INTEGER NOT NULL DEFAULT 1,
    "ultimaLeitura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "artigoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "LeituraDeArtigo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorito_usuarioId_idx" ON "Favorito"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_artigoId_usuarioId_key" ON "Favorito"("artigoId", "usuarioId");

-- CreateIndex
CREATE INDEX "LeituraDeArtigo_usuarioId_ultimaLeitura_idx" ON "LeituraDeArtigo"("usuarioId", "ultimaLeitura");

-- CreateIndex
CREATE UNIQUE INDEX "LeituraDeArtigo_artigoId_usuarioId_key" ON "LeituraDeArtigo"("artigoId", "usuarioId");

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_artigoId_fkey" FOREIGN KEY ("artigoId") REFERENCES "Artigo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeituraDeArtigo" ADD CONSTRAINT "LeituraDeArtigo_artigoId_fkey" FOREIGN KEY ("artigoId") REFERENCES "Artigo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeituraDeArtigo" ADD CONSTRAINT "LeituraDeArtigo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
