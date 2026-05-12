import { createTournament } from "@/app/dashboard/tournaments/actions";
import { TournamentForm } from "@/components/tournaments/tournament-form";

export const dynamic = "force-dynamic";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function NewTournamentPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Organizer dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Create tournament
        </h1>
      </div>

      <TournamentForm
        title="Tournament details"
        description="You are creating this tournament as the organizer. It will be linked to your signed-in account."
        action={createTournament}
        submitLabel="Create tournament"
        initialValues={{
          entryFee: "0",
          currency: "CAD",
          startDate: toDateInputValue(new Date()),
        }}
      />
    </main>
  );
}
