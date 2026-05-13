"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function SiteHeaderAuth() {
  return (
    <div className="flex shrink-0 items-center justify-end gap-3 sm:gap-4">
      <Show when="signed-out">
        <SignInButton />
        <SignUpButton>
          <button
            type="button"
            className="h-10 cursor-pointer rounded-full bg-purple-700 px-4 text-sm font-medium text-white sm:h-12 sm:px-5 sm:text-base"
          >
            Sign Up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  );
}
