'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import type { Role } from '@/generated/prisma/enums'
import { Prisma } from '@/generated/prisma/client'
import { requireRole } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { playerProfileUpdateSchema } from '@/lib/validations/player-profile'
type PlayerProfileFieldErrors = Partial<
Record<'firstName' | 'lastName' | 'city' | 'favoriteSportId' | 'level' | 'position', string[]>
>

export type UpdatePlayerProfileActionState = {
  fieldErrors?: PlayerProfileFieldErrors
  formError?: string
  successMessage?: string
  values?: Record<string, string>
}

const emptyUpdatePlayerProfileState: UpdatePlayerProfileActionState = {}

function valueFromForm(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}



function profileValuesFromForm(formData: FormData) {
  return {
    firstName: valueFromForm(formData, 'firstName'),
    lastName: valueFromForm(formData, 'lastName'),
    city: valueFromForm(formData, 'city'),
    favoriteSportId: valueFromForm(formData, 'favoriteSportId'),
    level: valueFromForm(formData, 'level'),
    position: valueFromForm(formData, 'position'),
  }
}

export async function saveRole(role: Role) {
  const { userId } = await auth()

  if (!userId) throw new Error('Not authenticated')

  const client = await clerkClient()

  await client.users.updateUser(userId, {
    publicMetadata: { role },
  })
}

export async function updatePlayerProfile(
  previousState: UpdatePlayerProfileActionState = emptyUpdatePlayerProfileState,
  formData: FormData
): Promise<UpdatePlayerProfileActionState> {
  void previousState

  const user = await requireRole('PLAYER')

  const values = profileValuesFromForm(formData)
  const parsed = playerProfileUpdateSchema.safeParse(values)

  if (!parsed.success) {
    return {
      values,
      fieldErrors: parsed.error.flatten().fieldErrors,
      formError: 'Please fix the highlighted fields.',
    }
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
        },
      }),
      prisma.playerProfile.upsert({
        where: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          city: parsed.data.city,
          favoriteSportId: parsed.data.favoriteSportId || null,
          level: parsed.data.level,
          position: parsed.data.position || null,
        } as any,
        update: {
          city: parsed.data.city,
          favoriteSportId: parsed.data.favoriteSportId || null,
          level: parsed.data.level,
          position: parsed.data.position || null,
        } as any,
      }),
    ])
  } catch {
    return {
      values,
      formError: 'Unable to save your profile right now. Please try again.',
    }
  }

  revalidatePath('/(player)/profile')

  return {}
}

export async function getUsersPaginated(q: string, page: number, pageSize: number) {
  const normalizedPage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
  const normalizedPageSize = Number.isFinite(pageSize) ? Math.max(1, Math.trunc(pageSize)) : 10;

  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { lastName: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};

  const [users, count] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
      orderBy: { lastName: "asc" },
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = count === 0 ? 0 : Math.ceil(count / normalizedPageSize);

  return {
    users,
    count,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalPages,
    hasPreviousPage: normalizedPage > 1,
    hasNextPage: totalPages > 0 && normalizedPage < totalPages,
  };
}