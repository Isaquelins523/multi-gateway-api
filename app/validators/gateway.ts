import vine from '@vinejs/vine'

export const updateGatewayValidator = vine.compile(
  vine.object({
    isActive: vine.boolean().optional(),
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    priority: vine.number().min(0).optional(),
    baseUrl: vine.string().trim().maxLength(512).nullable().optional(),
  })
)
