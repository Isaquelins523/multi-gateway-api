import { test } from '@japa/runner'
import type Gateway from '#models/gateway'
import {
  createTransactionAtGateway,
  refundAtGateway,
} from '#services/gateway_payment_service'

const makeGateway = (overrides: Partial<Gateway> = {}): Gateway =>
  ({
    id: 1,
    name: 'gateway1',
    baseUrl: 'http://fake-gateway',
    isActive: true,
    priority: 1,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  } as unknown as Gateway)

test.group('Gateway payment service', () => {
  test('createTransactionAtGateway retorna sucesso quando o gateway responde 2xx', async ({
    assert,
  }) => {
    const gateway = makeGateway()

    
    const originalFetch = global.fetch
    global.fetch = (async (url: any, options: any) => {
      assert.equal(
        url,
        `${gateway.baseUrl}/transactions`,
        'URL do gateway1 deve usar /transactions'
      )

      const body = JSON.parse(String((options as any)?.body ?? '{}'))
      assert.equal(body.amount, 1000)
      assert.equal(body.name, 'tester')

      return {
        ok: true,
        json: async () => ({ id: 'ext-123' }),
        text: async () => '',
        status: 200,
        statusText: 'OK',
      } as any
    }) as any

    const result = await createTransactionAtGateway(gateway, {
      amount: 1000,
      name: 'tester',
      email: 'tester@email.com',
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    global.fetch = originalFetch

    assert.isTrue(result.success)
    if (result.success) {
      assert.equal(result.externalId, 'ext-123')
    }
  })

  test('createTransactionAtGateway retorna erro quando o gateway responde não-2xx', async ({
    assert,
  }) => {
    const gateway = makeGateway()

    const originalFetch = global.fetch
    global.fetch = (async (_url: any, _options?: any) => {
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => '{"message":"Cartão inválido"}',
      } as any
    }) as any

    const result = await createTransactionAtGateway(gateway, {
      amount: 1000,
      name: 'tester',
      email: 'tester@email.com',
      cardNumber: '5569000000006063',
      cvv: '100',
    })

    global.fetch = originalFetch

    assert.isFalse(result.success)
    if (!result.success) {
      assert.include(result.error, '400')
    }
  })

  test('refundAtGateway usa o endpoint correto do gateway1', async ({ assert }) => {
    const gateway = makeGateway()
    const externalId = 'trx-1'

    const originalFetch = global.fetch
    let calledUrl = ''

    global.fetch = (async (url: any) => {
      calledUrl = String(url)
      return {
        ok: true,
        text: async () => '',
        status: 200,
        statusText: 'OK',
      } as any
    }) as any

    const result = await refundAtGateway(gateway, externalId)

    global.fetch = originalFetch

    assert.isTrue(result.success)
    assert.equal(
      calledUrl,
      `${gateway.baseUrl}/transactions/${encodeURIComponent(externalId)}/charge_back`
    )
  })
})

