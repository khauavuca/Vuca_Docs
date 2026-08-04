-- CreateTable
CREATE TABLE "ObservacaoDeRevisao" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidaEm" TIMESTAMP(3),
    "artigoId" TEXT NOT NULL,
    "autorId" TEXT,

    CONSTRAINT "ObservacaoDeRevisao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ObservacaoDeRevisao_artigoId_idx" ON "ObservacaoDeRevisao"("artigoId");

-- AddForeignKey
ALTER TABLE "ObservacaoDeRevisao" ADD CONSTRAINT "ObservacaoDeRevisao_artigoId_fkey" FOREIGN KEY ("artigoId") REFERENCES "Artigo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservacaoDeRevisao" ADD CONSTRAINT "ObservacaoDeRevisao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
