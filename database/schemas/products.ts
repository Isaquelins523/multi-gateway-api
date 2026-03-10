import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export class ProductSchema extends BaseModel {
    static $columns = ['createdAt', 'id', 'name','amount' , 'updatedAt'] as const
    $columns = ProductSchema.$columns
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime
    @column({ isPrimary: true })
    declare id: number
    @column()
    declare name: string
    @column()
    declare amount: number
    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime | null
}