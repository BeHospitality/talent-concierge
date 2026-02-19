import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import type { PropertyStats } from "@/hooks/useCommandCentre";

interface Props {
  properties: PropertyStats[];
}

type SortKey = keyof PropertyStats;

export function PortfolioTable({ properties }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("atRisk");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...properties].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [properties, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const exportCsv = () => {
    const headers = ["Property", "Active", "At Risk", "72hr %", "90-Day Retention %", "Overdue", "Last Activity"];
    const rows = sorted.map((p) => [
      p.orgName,
      p.activeJourneys,
      p.atRisk,
      `${p.seventyTwoHrSuccess}%`,
      `${p.ninetyDayRetention}%`,
      p.overdueEvents,
      p.lastActivity ? format(new Date(p.lastActivity), "MMM d, yyyy") : "—",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
      </div>
    </TableHead>
  );

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
          📊 Portfolio Overview
        </h2>
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={exportCsv}>
          <Download className="w-3 h-3" /> Export CSV
        </Button>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Property" field="orgName" />
              <SortHeader label="Active" field="activeJourneys" />
              <SortHeader label="At Risk" field="atRisk" />
              <SortHeader label="72hr %" field="seventyTwoHrSuccess" />
              <SortHeader label="Retention" field="ninetyDayRetention" />
              <SortHeader label="Overdue" field="overdueEvents" />
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => (
              <TableRow key={p.orgId}>
                <TableCell className="font-medium">{p.orgName}</TableCell>
                <TableCell>{p.activeJourneys}</TableCell>
                <TableCell className={p.atRisk > 0 ? "text-destructive font-semibold" : ""}>
                  {p.atRisk}
                </TableCell>
                <TableCell>{p.seventyTwoHrSuccess}%</TableCell>
                <TableCell>{p.ninetyDayRetention}%</TableCell>
                <TableCell className={p.overdueEvents > 0 ? "text-warning font-semibold" : ""}>
                  {p.overdueEvents}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {p.lastActivity ? format(new Date(p.lastActivity), "MMM d") : "—"}
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No properties found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
