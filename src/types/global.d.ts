export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: 'PLAYER' | 'ORGANIZER' | 'ADMIN'
    }
  }
}