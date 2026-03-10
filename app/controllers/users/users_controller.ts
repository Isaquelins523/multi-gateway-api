import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { createUserValidator, updateUserValidator } from '#validators/user_crud'

export default class UsersController {
  async index({ response }: HttpContext) {
    const users = 
    await User
    .query()
    .select('id', 'fullName', 'email', 'role', 'createdAt', 'updatedAt')
    .orderBy('id', 'asc')
    return response.ok(users)
  }

  async show({ params, response }: HttpContext) {
    const user = await User.query()
      .select('id', 'fullName', 'email', 'role', 'createdAt', 'updatedAt')
      .where('id', params.id)
      .firstOrFail()
    return response.ok(user)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)
    const hashedPassword = await hash.make(payload.password)
    const user = await User.create({
      fullName: payload.fullName,
      email: payload.email,
      password: hashedPassword,
      role: payload.role,
    })
    return response.created({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const payload = await request.validateUsing(updateUserValidator)

    if (payload.email) {
      const existing = await User.query()
        .where('email', payload.email)
        .whereNot('id', user.id)
        .first()
      if (existing) {
        return response.badRequest({
           errors: [{ message: 'Email já em uso', 
            field: 'email' 
          }] })
      }
      user.email = payload.email
    }
    if (payload.password) {
      payload.password = await hash.make(payload.password)
    }

    user.merge(payload)

    await user.save()

    return response.ok(user)
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    return response.noContent()
  }
}
