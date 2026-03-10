import vine from '@vinejs/vine'

const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const createUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(1).maxLength(255).nullable(),
    email: email().unique({ table: 'users', column: 'email' }),
    password: password(),
    role: vine.enum(['admin', 'user']),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(1).maxLength(255).nullable().optional(),
    email: email().optional(),
    password: password().optional(),
    role: vine.enum(['admin', 'user']).optional(),
  })
)
