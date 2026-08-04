import { PrismaClient } from "@prisma/client";

// Em desenvolvimento o Next recarrega os módulos a cada alteração.
// Guardar a instância no escopo global evita esgotar as conexões do banco.
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalParaPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.prisma = db;
}
