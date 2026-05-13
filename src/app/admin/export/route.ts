import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

function escapeCsv(value: unknown) {
  if (value === null || value === undefined) return '""';
  const s = String(value);
  return '"' + s.replace(/"/g, '""') + '"';
}

export async function GET() {
  await requireRole('ADMIN');

  const tournaments = await prisma.tournament.findMany({
    include: {
      organizer: { select: { id: true, firstName: true, lastName: true, email: true } },
      teams: {
        include: {
          members: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { joinRequests: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const header = [
    'tournamentId',
    'tournamentName',
    'sport',
    'city',
    'organizerId',
    'organizerFirstName',
    'organizerLastName',
    'organizerEmail',
    'teamId',
    'teamName',
    'teamMaxCapacity',
    'registeredCount',
    'remainingSpots',
    'pendingRequests',
    'playerId',
    'playerFirstName',
    'playerLastName',
    'playerEmail',
  ];

  const rows: string[] = [];
  rows.push(header.join(','));

  for (const t of tournaments) {
    if (!t.teams || t.teams.length === 0) {
      const line = [
        t.id,
        t.name,
        t.sport,
        t.city,
        t.organizer?.id ?? '',
        t.organizer?.firstName ?? '',
        t.organizer?.lastName ?? '',
        t.organizer?.email ?? '',
        '',
        '',
        '',
        '0',
        '',
        '0',
        '',
        '',
        '',
      ].map(escapeCsv).join(',');
      rows.push(line);
      continue;
    }

    for (const team of t.teams) {
      const registered = team.members?.length ?? 0;
      const remaining = Math.max(0, (team.maxCapacity ?? 0) - registered);
      const pending = team._count?.joinRequests ?? 0;

      if (!team.members || team.members.length === 0) {
        const line = [
          t.id,
          t.name,
          t.sport,
          t.city,
          t.organizer?.id ?? '',
          t.organizer?.firstName ?? '',
          t.organizer?.lastName ?? '',
          t.organizer?.email ?? '',
          team.id,
          team.name,
          team.maxCapacity ?? '',
          String(registered),
          String(remaining),
          String(pending),
          '',
          '',
          '',
          '',
        ].map(escapeCsv).join(',');
        rows.push(line);
        continue;
      }

      for (const m of team.members) {
        const line = [
          t.id,
          t.name,
          t.sport,
          t.city,
          t.organizer?.id ?? '',
          t.organizer?.firstName ?? '',
          t.organizer?.lastName ?? '',
          t.organizer?.email ?? '',
          team.id,
          team.name,
          team.maxCapacity ?? '',
          String(registered),
          String(remaining),
          String(pending),
          m.id,
          m.firstName ?? '',
          m.lastName ?? '',
          m.email ?? '',
        ].map(escapeCsv).join(',');

        rows.push(line);
      }
    }
  }

  const csv = rows.join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="admin-export.csv"',
    },
  });
}
