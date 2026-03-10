import { TransactionProductSchema } from '#database/schema'

export default class TransactionProduct extends TransactionProductSchema {
  static table = 'transaction_products'
}
