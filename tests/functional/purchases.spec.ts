import { test } from '@japa/runner'
import Gateway from '#models/gateway'
import Transaction from '#models/transaction'

// Helpers para stubar o fetch global em cada teste funcional
const withStubbedFetch = async (
  handler: (calls: { url: any; options: any }[]) => Promise<void>
) => {
  const originalFetch = global.fetch
  const calls: { url: any; options: any }[] = []

  global.fetch = (async (url: any, options: any) => {
    calls.push({ url, options })
    // Resposta padrão de sucesso; cenários específicos podem sobrescrever dentro do handler
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ id: 'ext-123' }),
      text: async () => '',
    } as any
  }) as any

  try {
    await handler(calls)
  } finally {
    global.fetch = originalFetch
  }
}

test.group('Purchases - fluxo multi-gateway', (group) => {
  group.each.teardown(async () => {
    await Transaction.query().delete()
    await Gateway.query().delete()
  })

  test('cria compra com sucesso no primeiro gateway', async ({ client, assert }) => {
    await Gateway.createMany([
      {
        name: 'gateway1',
        isActive: true,
        priority: 1,
        baseUrl: 'http://fake-gw1',
      },
      {
        name: 'gateway2',
        isActive: true,
        priority: 2,
        baseUrl: 'http://fake-gw2',
      },
    ])

    await withStubbedFetch(async (calls) => {
      const response = await client.post('/api/v1/purchases').json({
        amount: 1000,
        name: 'Tester',
        email: 'tester@example.com',
        cardNumber: '5569000000006063',
        cvv: '010',
      })

      response.assertStatus(201)
      response.assertBodyContains({
        message: 'Compra realizada com sucesso',
      })

      // Só o primeiro gateway deve ter sido chamado
      assert.equal(calls.length, 1)
      assert.match(String(calls[0].url), /fake-gw1/)
    })
  })

  test('tenta segundo gateway quando o primeiro falha', async ({ client, assert }) => {
    await Gateway.createMany([
      {
        name: 'gateway1',
        isActive: true,
        priority: 1,
        baseUrl: 'http://fake-gw1',
      },
      {
        name: 'gateway2',
        isActive: true,
        priority: 2,
        baseUrl: 'http://fake-gw2',
      },
    ])

    await withStubbedFetch(async (calls) => {
      // Ajusta o stub para: primeira chamada falha, segunda tem sucesso
      (global.fetch as any) = (async (url: any, _options: any) => {
        calls.push({ url, options: _options })
        if (calls.length === 1) {
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'fail on gw1',
          } as any
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ id: 'ext-456' }),
          text: async () => '',
        } as any
      }) as any

      const response = await client.post('/api/v1/purchases').json({
        amount: 1500,
        name: 'Tester 2',
        email: 'tester2@example.com',
        cardNumber: '5569000000006063',
        cvv: '010',
      })

      response.assertStatus(201)
      response.assertBodyContains({
        message: 'Compra realizada com sucesso',
      })

      assert.equal(calls.length, 2)
      assert.match(String(calls[0].url), /fake-gw1/)
      assert.match(String(calls[1].url), /fake-gw2/)
    })
  })

  test('retorna erro quando todos os gateways falham', async ({ client, assert }) => {
    await Gateway.createMany([
      {
        name: 'gateway1',
        isActive: true,
        priority: 1,
        baseUrl: 'http://fake-gw1',
      },
      {
        name: 'gateway2',
        isActive: true,
        priority: 2,
        baseUrl: 'http://fake-gw2',
      },
    ])

    await withStubbedFetch(async () => {
      (global.fetch as any) = (async () => {
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'gw error',
        } as any
      }) as any

      const response = await client.post('/api/v1/purchases').json({
        amount: 2000,
        name: 'Tester 3',
        email: 'tester3@example.com',
        cardNumber: '5569000000006063',
        cvv: '010',
      })

      response.assertStatus(400)
      response.assertBodyContains({
        message: 'Todos os gateways falharam',
      })

      // Nenhuma transação deve ser criada no banco
      const trxCount = await Transaction.query().count('* as total')
      assert.equal(Number(trxCount[0].$extras.total), 0)
    })
  })
})

