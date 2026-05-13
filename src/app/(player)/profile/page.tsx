import { PlayerProfileForm } from "@/components/profile/player-profile-form";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updatePlayerProfile } from "@/server/actions/users";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage() {
	const user = await requireRole("PLAYER");

	const profile = await prisma.playerProfile.findUnique({
		where: {
			userId: user.id,
		},
	});

	const sports = await (prisma as any).sport.findMany({ orderBy: { name: 'asc' } });
  
	return (
		<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
			<div>
				<p className="text-sm font-medium text-muted-foreground">Player</p>
				<h1 className="mt-2 text-3xl font-semibold tracking-tight">My profile</h1>
			</div>

			<PlayerProfileForm
				action={updatePlayerProfile}
				initialValues={{
					    firstName: user.firstName ?? "",
					    lastName: user.lastName ?? "",
					    city: profile?.city ?? "",
						  favoriteSportId: (profile as any)?.favoriteSportId ?? "",
					    level: profile?.level ?? "BEGINNER",
					    position: profile?.position ?? "",
				}}
							sports={sports.map((s: any) => ({ id: s.id, name: s.name }))}
			/>
		</main>
	);
}

