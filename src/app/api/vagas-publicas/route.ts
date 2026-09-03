import { NextResponse } from "next/server";
import { rawAll } from "@/lib/orm";

export async function GET() {
  const vagas = rawAll(`
    SELECT id, title, description, specialties, unitIds, expiresAt
    FROM JobOpening
    WHERE status = 'Aberta'
      AND (expiresAt IS NULL OR expiresAt >= date('now'))
    ORDER BY createdAt DESC
  `);

  return NextResponse.json(vagas || []);
}
