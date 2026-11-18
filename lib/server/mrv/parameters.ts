import "server-only";

import { prisma } from "@/lib/prisma";
import { carbonParameterFields } from "@/lib/mrv/carbon-parameter-fields";
import { CommandApiError, databaseErrorCode } from "@/lib/server/command/http";

export async function listCarbonParameters() {
  const rows = await prisma.carbonParameterSet.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }, { id: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    source: row.source,
    isActive: row.isActive,
    isDemoData: row.isDemoData,
    biomassFactor: Number(row.biomassFactor),
    emissionFactor: Number(row.emissionFactor),
    co2ConversionFactor: Number(row.co2ConversionFactor),
    incentivePerTonIdr: Number(row.incentivePerTonIdr),
  }));
}

export async function createCarbonParameters(
  input: Record<string, unknown>,
  actorId: string,
) {
  const { name, source, isDemoData, isActive } = input;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 120 ||
    typeof source !== "string" ||
    !source.trim() ||
    source.length > 300 ||
    typeof isDemoData !== "boolean" ||
    typeof isActive !== "boolean"
  ) {
    throw new CommandApiError(
      400,
      "invalid_parameters",
      "Isi nama versi, sumber, dan faktor karbon.",
    );
  }
  const values = Object.fromEntries(
    carbonParameterFields.map((field) => [
      field.name,
      factor(input[field.name], field),
    ]),
  ) as Record<(typeof carbonParameterFields)[number]["name"], string>;

  try {
    return await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(186202611, 21)`;
      if (isActive)
        await transaction.carbonParameterSet.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      const parameter = await transaction.carbonParameterSet.create({
        data: {
          name: name.trim(),
          source: source.trim(),
          ...values,
          isDemoData,
          isActive,
        },
        select: { id: true },
      });
      await transaction.auditEvent.create({
        data: {
          actorId,
          aggregateType: "CarbonParameterSet",
          aggregateId: parameter.id,
          eventType: "CARBON_PARAMETER_VERSION_CREATED",
          payload: { source: source.trim(), isDemoData, isActive },
        },
      });
      return parameter;
    });
  } catch (error) {
    if (databaseErrorCode(error) === "P2002")
      throw new CommandApiError(
        409,
        "duplicate_version",
        "Nama versi sudah digunakan.",
      );
    throw error;
  }
}

function factor(
  value: unknown,
  { min, max, decimals, label }: (typeof carbonParameterFields)[number],
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    Number(value.toFixed(decimals)) !== value
  ) {
    throw new CommandApiError(
      400,
      "invalid_factor",
      `${label} harus antara ${min} dan ${max} dengan maksimal ${decimals} angka desimal.`,
    );
  }
  return value.toFixed(decimals);
}
