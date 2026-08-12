import { Toaster } from "sonner";
import { FileExplorer } from "@/components/FileExplorer";

export default function App() {
  return (
    <div className="flex min-h-screen justify-center bg-background p-4 md:p-8">
      <Toaster richColors position="bottom-right" />
      <div className="w-full max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Files</h1>
          <p className="mt-1 text-muted-foreground">
            Drag rows to reorder, drop them onto folders or breadcrumbs to move them.
          </p>
        </header>

        <main className="flex h-[75vh] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
          <FileExplorer />
        </main>
      </div>
    </div>
  );
}
