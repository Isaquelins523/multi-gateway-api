import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export class UserSchema extends BaseModel {
  static $columns = ['createdAt', 'email', 'fullName', 'id', 'password', 'role', 'updatedAt'] as const
  $columns = UserSchema.$columns
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column()
  declare email: string
  @column()
  declare fullName: string | null
  @column({ isPrimary: true })
  declare id: number
  @column({ serializeAs: null })
  declare password: string
  @column()
  declare role: UserRole
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
