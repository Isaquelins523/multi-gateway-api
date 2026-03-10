import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export class TransactionProductSchema extends BaseModel {
    static $columns = ['createdAt', 'id', 'transactionId', 'productId', 'quantity', 'updatedAt'] as const
    $columns = TransactionProductSchema.$columns
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime
    @column({ isPrimary: true })
    declare id: number
    @column()
    declare transactionId: number
    @column()
    declare productId: number
}