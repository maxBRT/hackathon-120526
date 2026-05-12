'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import type { Role } from '@/generated/prisma/enums'

export async function saveRole(role: Role) {
  const { userId } = await auth()

  if (!userId) throw new Error('Not authenticated')

  const client = await clerkClient()

  await client.users.updateUser(userId, {
    publicMetadata: { role },
  })

}