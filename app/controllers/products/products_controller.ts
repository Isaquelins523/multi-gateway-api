import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { createProductValidator, updateProductValidator } from '#validators/product'

export default class ProductsController {
  async index({ response }: HttpContext) {
    const products = await Product.query().orderBy('id', 'asc')
    return response.ok(products)
  }

  async show({ params, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    return response.ok(product)
  }

  async store({ request, response }: HttpContext) {
    const { name, amount } = await request.validateUsing(createProductValidator)
    const product = await Product.create({
      name,
      amount: amount.toFixed(2),
    })
    return response.created(product)
  }

  async update({ params, request, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const payload = await request.validateUsing(updateProductValidator)

    if (payload.name !== undefined) product.name = payload.name
    if (payload.amount !== undefined) product.amount = payload.amount.toFixed(2)

    await product.save()

    return response.ok(product)
  }

  async destroy({ params, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    await product.delete()
    return response.noContent()
  }
}
