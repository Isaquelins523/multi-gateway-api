import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Gateway from '#models/gateway'

export default class GatewaySeeder extends BaseSeeder {
  async run() {
    const gateways = [
      { name: 'gateway1', isActive: true, priority: 0, baseUrl: null },
      { name: 'gateway2', isActive: true, priority: 1, baseUrl: null },
    ]

    for (const data of gateways) {
      await Gateway.firstOrCreate({ name: data.name }, data)
    }
  }
}
