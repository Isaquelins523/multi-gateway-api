import vine from '@vinejs/vine'

/**
 * Validação para compra (Nível 1: valor vem direto pela API).
 * Não exige productId/quantity.
 */
export const purchaseValidator = vine.compile(
  vine.object({
    amount: vine.number().positive(),
    name: vine.string().trim().minLength(1).maxLength(255),
    email: vine.string().email().maxLength(254),
    cardNumber: vine.string().trim().minLength(16).maxLength(16).regex(/^\d{16}$/),
    cvv: vine.string().trim().minLength(3).maxLength(4).regex(/^\d{3,4}$/),
  })
)
