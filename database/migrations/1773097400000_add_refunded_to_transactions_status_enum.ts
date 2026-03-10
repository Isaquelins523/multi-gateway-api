import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    // Só aplica alteração de ENUM quando a conexão é MySQL.
    // Em SQLite (usado nos testes), essa migration é ignorada.
    if (this.db.dialect.name === 'mysql') {
      this.schema.raw(
        "ALTER TABLE `transactions` MODIFY COLUMN `status` ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending'"
      )
    }
  }

  async down() {
    if (this.db.dialect.name === 'mysql') {
      this.schema.raw(
        "ALTER TABLE `transactions` MODIFY COLUMN `status` ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending'"
      )
    }
  }
}
