-- CreateEnum
CREATE TYPE "TipoDeMudanca" AS ENUM ('NOVIDADE', 'MELHORIA', 'CORRECAO', 'TAREFA');

-- CreateTable
CREATE TABLE "NotaDeVersao" (
    "id" TEXT NOT NULL,
    "produto" TEXT NOT NULL,
    "versao" TEXT NOT NULL,
    "titulo" TEXT,
    "descricao" TEXT,
    "dataDeLancamento" TIMESTAMP(3),
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "autorId" TEXT,

    CONSTRAINT "NotaDeVersao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemDeMudanca" (
    "id" TEXT NOT NULL,
    "tipo" "TipoDeMudanca" NOT NULL,
    "texto" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "notaId" TEXT NOT NULL,

    CONSTRAINT "ItemDeMudanca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotaDeVersao_produto_idx" ON "NotaDeVersao"("produto");

-- CreateIndex
CREATE INDEX "NotaDeVersao_publicada_dataDeLancamento_idx" ON "NotaDeVersao"("publicada", "dataDeLancamento");

-- CreateIndex
CREATE INDEX "ItemDeMudanca_notaId_idx" ON "ItemDeMudanca"("notaId");

-- AddForeignKey
ALTER TABLE "NotaDeVersao" ADD CONSTRAINT "NotaDeVersao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDeMudanca" ADD CONSTRAINT "ItemDeMudanca_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "NotaDeVersao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
