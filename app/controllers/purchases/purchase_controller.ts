import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'
import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import { purchaseValidator } from '#validators/purchase'
import {
  createTransactionAtGateway,
  refundAtGateway,
} from '#services/gateway_payment_service'

export default class PurchaseController {
  async index({ response }: HttpContext) {
    const transactions = await Transaction.query().orderBy('id', 'desc')

    const clientIds = [...new Set(transactions.map((t) => t.clientId))]
    const gatewayIds = [...new Set(transactions.map((t) => t.gatewayId))]

    const clients =
      clientIds.length > 0 ? await Client.query().whereIn('id', clientIds) : []
    const gateways =
      gatewayIds.length > 0 ? await Gateway.query().whereIn('id', gatewayIds) : []

    const clientsById = new Map(clients.map((c) => [c.id, c]))
    const gatewaysById = new Map(gateways.map((g) => [g.id, g]))

    const purchases = transactions.map((t) => {
      const client = clientsById.get(t.clientId)
      const gateway = gatewaysById.get(t.gatewayId)
      return {
        id: t.id,
        externalId: t.externalId,
        amount: t.amount,
        status: t.status,
        cardLastNumber: t.cardLastNumber,
        createdAt: t.createdAt,
        client: client
          ? { id: client.id, name: client.name, email: client.email }
          : null,
        gateway: gateway ? { id: gateway.id, name: gateway.name } : null,
      }
    })

    return response.ok(purchases)
  }

  async show({ params, response }: HttpContext) {
    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return response.badRequest({ message: 'ID da compra inválido' })
    }

    const transaction = await Transaction.findOrFail(id)
    const client = await Client.find(transaction.clientId)
    const gateway = await Gateway.find(transaction.gatewayId)

    const purchase = {
      id: transaction.id,
      externalId: transaction.externalId,
      amount: transaction.amount,
      status: transaction.status,
      cardLastNumber: transaction.cardLastNumber,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      client: client
        ? { id: client.id, name: client.name, email: client.email }
        : null,
      gateway: gateway ? { id: gateway.id, name: gateway.name } : null,
    }

    return response.ok(purchase)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(purchaseValidator)
    const { amount, name, email, cardNumber, cvv } = payload

    const client = await Client.firstOrCreate({ email }, { name, email })

    if (client.name !== name) {
      client.name = name
      await client.save()
    }

    const gateways = await Gateway.query()
      .where('isActive', true)
      .orderBy('priority', 'asc')

    if (!gateways.length) {
      return response.badRequest({ message: 'Nenhum gateway disponível' })
    }

    let transaction: Transaction | null = null
    let lastError: string | undefined

    for (const gateway of gateways) {
      const result = await createTransactionAtGateway(gateway, {
        amount,
        name,
        email,
        cardNumber,
        cvv,
      })

      if (result.success) {
        transaction = await Transaction.create({
          clientId: client.id,
          gatewayId: gateway.id,
          externalId: result.externalId,
          amount: String(amount),
          status: 'completed',
          cardLastNumber: cardNumber.slice(-4),
        })
        break
      }

      lastError = result.error
    }

    if (!transaction) {
      return response.badRequest({
        message: 'Todos os gateways falharam',
        error: lastError,
      })
    }

    return response.created({
      message: 'Compra realizada com sucesso',
      transaction,
    })
  }

  async refund({ params, response }: HttpContext) {
    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return response.badRequest({ message: 'ID da compra inválido' })
    }

    const transaction = await Transaction.findOrFail(id)
    const status = transaction.status ?? ''

    const naoReembolsavel = ['refunded', 'cancelled', 'canceled']
    if (naoReembolsavel.includes(status.toLowerCase())) {
      return response.badRequest({
        message: `Compra não pode ser reembolsada: status atual é "${status}".`,
      })
    }

    const gateway = await Gateway.findOrFail(transaction.gatewayId)
    if (!gateway.isActive) {
      return response.badRequest({
        message: 'Gateway desta compra está inativo. Reembolso não realizado.',
      })
    }

    const result = await refundAtGateway(gateway, transaction.externalId)

    if (!result.success) {
      return response.badRequest({
        message: 'Falha ao reembolsar no gateway.',
        error: result.error,
      })
    }

    transaction.status = 'refunded'
    await transaction.save()

    return response.ok({
      message: 'Reembolso realizado com sucesso.',
      transaction: {
        id: transaction.id,
        externalId: transaction.externalId,
        amount: transaction.amount,
        status: transaction.status,
      },
    })
  }
}
