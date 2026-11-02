import { requireRole } from "@/lib/authz";
import { getMrvLedger } from "@/lib/server/mrv/data";
import { serializeMrvLedgerCsv } from "@/lib/server/mrv/export";
import { createMrvPrivateHandler } from "@/lib/server/mrv/http";
import { parseLedgerExportFilters } from "@/lib/server/mrv/validation";

const MAX_EXPORT_ROWS = 5_000;

export const GET = createMrvPrivateHandler(
  async (request) => {
    const parsed = parseLedgerExportFilters(new URL(request.url).searchParams);

    if (!parsed.ok) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    const ledger = await getMrvLedger({
      ...parsed.value,
      page: 1,
      pageSize: MAX_EXPORT_ROWS,
    });

    if (ledger.total > MAX_EXPORT_ROWS) {
      return Response.json(
        {
          error: `Filter menghasilkan lebih dari ${MAX_EXPORT_ROWS} baris; persempit rentang ekspor.`,
        },
        { status: 413 },
      );
    }

    if (parsed.value.format === "csv") {
      return new Response(serializeMrvLedgerCsv(ledger), {
        headers: {
          "Content-Disposition":
            'attachment; filename="peatguard-mrv-ledger.csv"',
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    return Response.json(
      {
        exportedAt: new Date().toISOString(),
        filters: ledger.filters,
        records: ledger.rows,
        total: ledger.total,
      },
      {
        headers: {
          "Content-Disposition":
            'attachment; filename="peatguard-mrv-ledger.json"',
        },
      },
    );
  },
  {
    authorize: (request) => requireRole(["VERIFIKATOR"], request.headers),
    failureMessage: "Ekspor log MRV belum dapat dibuat.",
  },
);
