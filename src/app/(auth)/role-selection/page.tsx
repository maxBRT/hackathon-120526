'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@clerk/nextjs'
import { saveRole } from '@/server/actions/users'
import { cn } from '@/lib/utils'
import type { Role } from '@/generated/prisma/enums'

const roles = [
  {
    value: 'PLAYER' as Role,
    label: 'Joueur',
    description: 'Rejoignez des équipes, participez à des tournois et suivez vos performances.',
    icon: '⚽',
  },
  {
    value: 'ORGANIZER' as Role,
    label: 'Organisateur',
    description: 'Créez et gérez des tournois, formez des équipes et coordonnez des matchs.',
    icon: '🏆',
  },
]

export default function OnboardingPage() {
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const { session } = useSession()
  const router = useRouter()

  async function handleSubmit() {
    if (!role || !session) return
    setLoading(true)
    try {
      await saveRole(role)
      await session.reload()
      router.push('/')
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Bienvenue
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Quel type de compte voulez-vous?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choisissez le rôle qui correspond le mieux à votre utilisation de la plateforme.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map(({ value, label, description, icon }) => (
          <button
            key={value}
            onClick={() => setRole(value)}
            className={cn(
              'flex flex-col gap-3 rounded-xl border p-6 text-left transition-all',
              'hover:border-foreground/30 hover:bg-muted/50',
              role === value
                ? 'border-foreground bg-muted ring-1 ring-foreground'
                : 'border-border bg-card'
            )}
          >
            <span className="text-3xl">{icon}</span>
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">{label}</span>
              <span className="text-sm text-muted-foreground">{description}</span>
            </div>
            <div
              className={cn(
                'ml-auto mt-auto h-4 w-4 rounded-full border-2 transition-all',
                role === value
                  ? 'border-foreground bg-foreground'
                  : 'border-muted-foreground'
              )}
            />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-end border-t pt-6">
        <button
          onClick={handleSubmit}
          disabled={!role || loading}
          className={cn(
            'rounded-lg px-6 py-2.5 text-sm font-medium transition-all',
            'bg-foreground text-background',
            'hover:opacity-90 active:scale-[0.98]',
            'disabled:cursor-not-allowed disabled:opacity-40'
          )}
        >
          {loading ? 'Enregistrement...' : 'Continuer'}
        </button>
      </div>
    </main>
  )
}