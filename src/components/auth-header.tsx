'use client'

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export function AuthHeader() {
  return (
    <header className="flex justify-end items-center p-4 gap-4 h-16">
      <Show when="signed-out">
        <SignInButton />
        <SignUpButton>
          <button
            type="button"
            className="bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer"
          >
            Sign Up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link
          href="/my-requests"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          My requests
        </Link>
        <UserButton />
      </Show>
    </header>
  )
}
