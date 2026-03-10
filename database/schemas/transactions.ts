import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class TransactionSchema extends BaseModel {
    static $columns = ['createdAt', 'id', 'client', 'gateway','external_id', 'amount', 'status','card_last_number', 'updatedAt'] as const
    $columns = TransactionSchema.$columns
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime
    @column({ isPrimary: true })
    declare id: number
    @column()
    declare client: number
    @column()
    declare gateway: number
    @column()
    declare external_id: string
    @column()
    declare amount: number
    @column()
    declare status: TransactionStatus
    @column()
    declare card_last_number: string
    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime | null
}