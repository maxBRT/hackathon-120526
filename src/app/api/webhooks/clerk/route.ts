import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import type { Role } from '@/generated/prisma/enums'

function extractRole(publicMetadata: Record<string, unknown>): Role | undefined {
  const role = publicMetadata?.role
  if (role === 'PLAYER' || role === 'ORGANIZER' || role === 'ADMIN') return role
  return undefined
}

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name, public_metadata } = evt.data
      const role = extractRole(public_metadata)
      await prisma.user.upsert({
        where: { id: id },
        update: {},
        create: {
          id: id,
          email: email_addresses[0]?.email_address ?? '',
          firstName: first_name ?? '',
          lastName: last_name ?? '',
          ...(role && { role }),
        },
      })
    }

    if (evt.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, public_metadata } = evt.data
      const role = extractRole(public_metadata)
      
      await prisma.user.upsert({
        where: { id: id },
        update: {
          email: email_addresses[0]?.email_address ?? '',
          firstName: first_name ?? '',
          lastName: last_name ?? '',
          ...(role && { role }),
        },
        create: {
          id: id,
          email: email_addresses[0]?.email_address ?? '',
          firstName: first_name ?? '',
          lastName: last_name ?? '',
          role: role as Role ?? 'PLAYER' as Role,
        },
      })
    }

    if (evt.type === 'user.deleted') {
      const { id } = evt.data
      if (id) {
        await prisma.user
          .delete({
            where: { id: id },
          })
          .catch(() => {}) // Ignore if already deleted
      }
    }

    return new Response('Webhook processed', { status: 200 })
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Invalid webhook', { status: 400 })
  }
}