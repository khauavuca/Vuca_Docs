-- CreateTable
CREATE TABLE "Comunicado" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "fixado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT,

    CONSTRAINT "Comunicado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comunicado_criadoEm_idx" ON "Comunicado"("criadoEm");

-- AddForeignKey
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
