import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Initialisation du client Supabase avec les clés du .env
  const supabase = createMiddlewareClient({ req, res })

  // Vérification de la session active
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Si pas de session ET que l'utilisateur n'est pas déjà sur la page de login
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    // On le redirige de force vers /login
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Si l'utilisateur est connecté mais essaie d'aller sur /login, on le renvoie vers l'accueil
  if (session && req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  // Le middleware s'applique à toutes les routes sauf les fichiers statiques (images, etc.)
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
