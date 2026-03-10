import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('client_id').unsigned().notNullable().references('id').inTable('clients')
      table.integer('gateway_id').unsigned().notNullable().references('id').inTable('gateways')
      table.string('external_id').notNullable()
      table.decimal('amount').notNullable()
      table.enum('status', ['pending', 'completed', 'failed', 'cancelled']).defaultTo('pending')
      table.string('card_last_number').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
