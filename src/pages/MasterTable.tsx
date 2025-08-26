import { MasterTable } from "@/components/ui/master-table";

export default function MasterTablePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Master Table</h1>
          <p className="text-muted-foreground mt-1">
            Manage your deduplicated contact database with real-time updates.
          </p>
        </div>
      </div>

      {/* Master Table Component */}
      <MasterTable />
    </div>
  );
}