import type { HttpContext } from '@adonisjs/core/http'
import Gateway from '#models/gateway'
import { updateGatewayValidator } from '#validators/gateway'

export default class GatewaysController {
  async index({ response }: HttpContext) {
    const gateways = await Gateway.query().orderBy('priority', 'desc').orderBy('id', 'asc')
    return response.ok(gateways)
  }

  async show({ params, response }: HttpContext) {
    const gateway = await Gateway.findOrFail(params.id)
    return response.ok(gateway)
  }

  async update({ params, request, response }: HttpContext) {
    const gateway = await Gateway.findOrFail(params.id)
    const payload = await request.validateUsing(updateGatewayValidator)

    if (payload.isActive !== undefined) gateway.isActive = payload.isActive
    if (payload.name !== undefined) gateway.name = payload.name
    if (payload.priority !== undefined) gateway.priority = payload.priority
    if (payload.baseUrl !== undefined) gateway.baseUrl = payload.baseUrl

    await gateway.save()
    return response.ok(gateway)
  }
}
