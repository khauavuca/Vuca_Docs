-- CreateEnum
CREATE TYPE "TipoDeAcao" AS ENUM ('CRIACAO', 'EDICAO', 'PUBLICACAO', 'DEVOLUCAO', 'RESTAURACAO', 'EXCLUSAO', 'ACESSO_ALTERADO');

-- CreateTable
CREATE TABLE "RegistroDeAuditoria" (
    "id" TEXT NOT NULL,
    "acao" "TipoDeAcao" NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "descricao" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT,

    CONSTRAINT "RegistroDeAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistroDeAuditoria_criadoEm_idx" ON "RegistroDeAuditoria"("criadoEm");

-- CreateIndex
CREATE INDEX "RegistroDeAuditoria_entidade_entidadeId_idx" ON "RegistroDeAuditoria"("entidade", "entidadeId");

-- AddForeignKey
ALTER TABLE "RegistroDeAuditoria" ADD CONSTRAINT "RegistroDeAuditoria_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
