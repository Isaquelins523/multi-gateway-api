import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export class GatewaySchema extends BaseModel {
  static $columns = ['baseUrl', 'createdAt', 'id', 'isActive', 'name', 'priority', 'updatedAt'] as const
  $columns = GatewaySchema.$columns
  @column()
  declare baseUrl: string | null
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare isActive: boolean
  @column()
  declare name: string
  @column()
  declare priority: number
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
