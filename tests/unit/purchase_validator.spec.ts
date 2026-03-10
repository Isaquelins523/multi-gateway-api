import { test } from '@japa/runner'
import { purchaseValidator } from '#validators/purchase'

test.group('Purchase validator (Nível 1)', () => {
  test('valida payload válido', async ({ assert }) => {
    const payload = {
      amount: 1000,
      name: 'Tester',
      email: 'tester@email.com',
      cardNumber: '5569000000006063',
      cvv: '010',
    }

    const result = await purchaseValidator.validate(payload)

    assert.equal(result.amount, payload.amount)
  })

  test('rejeita payload com cardNumber inválido', async ({ assert }) => {
    const payload = {
      amount: 1000,
      name: 'Tester',
      email: 'tester@email.com',
      cardNumber: '1234', 
      cvv: '010',
    }

   
    await assert.rejects(() => purchaseValidator.validate(payload))
  })
})

