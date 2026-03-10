import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.raw(
      "ALTER TABLE `transactions` MODIFY COLUMN `status` ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending'"
    )
  }

  async down() {
    this.schema.raw(
      "ALTER TABLE `transactions` MODIFY COLUMN `status` ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending'"
    )
  }
}
