import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function SupabaseTestPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Test query against Supabase (e.g. todos table or auth session)
  const { data: todos, error } = await supabase.from("todos").select();

  return (
    <div className="container py-12 space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Supabase Connectivity Status</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Connected to: <span className="font-mono text-primary">{process.env.NEXT_PUBLIC_SUPABASE_URL}</span>
        </p>

        {error ? (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-xs font-mono text-amber-600 dark:text-amber-400">
            Note: Table query test returned: {error.message} (Create the 'todos' table in your Supabase Dashboard to see data).
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Todos Table Records ({todos?.length ?? 0}):</h2>
            {todos && todos.length > 0 ? (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {todos.map((todo: any) => (
                  <li key={todo.id}>{todo.name || todo.title || JSON.stringify(todo)}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No records found in 'todos' table yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
