import { redirect } from "@sveltejs/kit"
import { auth } from "#lib/stores/auth.svelte.js"

export function load() {
  if (!auth.isAuthenticated) {
    redirect(307, "/login")
  }
}
