import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'
import Product from '#models/product'
import Transaction from '#models/transaction'
import TransactionProduct from '#models/transaction_product'

export default class ClientsController {
  async index({ response }: HttpContext) {
    const clients = await Client.query().orderBy('id', 'asc')
    return response.ok(clients)
  }

  async show({ params, response }: HttpContext) {
    const clientId = Number(params.id)
    if (Number.isNaN(clientId)) {
      return response.badRequest({ message: 'Invalid client id' })
    }

    const client = await Client.findOrFail(clientId)

    const transactions = await Transaction.query()
      .where('clientId', clientId)
      .orderBy('id', 'desc')

    const transactionIds = transactions.map((t) => t.id)
    const items = transactionIds.length
      ? await TransactionProduct.query().whereIn('transactionId', transactionIds)
      : []

    const productIds = [...new Set(items.map((i) => i.productId))]
    const products = productIds.length ? await Product.query().whereIn('id', productIds) : []
    const productsById = new Map(products.map((p) => [p.id, p]))

    const itemsByTransaction = new Map<number, typeof items>()
    for (const item of items) {
      const list = itemsByTransaction.get(item.transactionId) ?? []
      list.push(item)
      itemsByTransaction.set(item.transactionId, list)
    }

    return response.ok({
      client,
      purchases: transactions.map((t) => ({
        id: t.id,
        externalId: t.externalId,
        amount: t.amount,
        status: t.status,
        createdAt: t.createdAt,
        items: (itemsByTransaction.get(t.id) ?? []).map((i) => {
          const product = productsById.get(i.productId)
          return {
            productId: i.productId,
            quantity: i.quantity,
            product: product
              ? { id: product.id, name: product.name, amount: product.amount }
              : null,
          }
        }),
      })),
    })
  }
}

