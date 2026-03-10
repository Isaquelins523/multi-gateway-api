import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Roles middleware: allows access only if the authenticated user
 * has one of the given roles. Must be used after auth middleware.
 */
export default class RolesMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      roles: string[]
    }
  ) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized({ message: 'Não autenticado' })
    }

    const role = (user as { role?: string }).role
    if (!role || !options.roles.includes(role)) {
      return ctx.response.forbidden({
        message: 'Sem permissão para esta ação',
      })
    }

    return next()
  }
}
