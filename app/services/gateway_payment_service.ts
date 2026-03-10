import type Gateway from '#models/gateway'

function getBaseUrl(gateway: Gateway): string {
  const url = gateway.baseUrl?.trim()
  if (url) return url.replace(/\/$/, '')

  if (gateway.name === 'gateway1') {
    return process.env.GATEWAY1_BASE_URL ?? 'http://localhost:3001'
  }
  if (gateway.name === 'gateway2') {
    return process.env.GATEWAY2_BASE_URL ?? 'http://localhost:3002'
  }
  return ''
}

export type PurchasePayload = {
  amount: number
  name: string
  email: string
  cardNumber: string
  cvv: string
}

export type CreateTransactionResult =
  | { success: true; externalId: string }
  | { success: false; error: string }


export async function createTransactionAtGateway(
  gateway: Gateway,
  payload: PurchasePayload
): Promise<CreateTransactionResult> {
  const baseUrl = getBaseUrl(gateway)
  if (!baseUrl) {
    return { success: false, error: `Gateway ${gateway.name} sem URL configurada` }
  }

  try {
    if (gateway.name === 'gateway1') {
      const res = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payload.amount,
          name: payload.name,
          email: payload.email,
          cardNumber: payload.cardNumber,
          cvv: payload.cvv,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        return { success: false, error: `${res.status} ${text || res.statusText}` }
      }
      const data = (await res.json().catch(() => ({}))) as { id?: string }
      const externalId = data?.id != null ? String(data.id) : ''
      return { success: true, externalId }
    }

    if (gateway.name === 'gateway2') {
      const res = await fetch(`${baseUrl}/transacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: payload.amount,
          nome: payload.name,
          email: payload.email,
          numeroCartao: payload.cardNumber,
          cvv: payload.cvv,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        return { success: false, error: `${res.status} ${text || res.statusText}` }
      }
      const data = (await res.json().catch(() => ({}))) as { id?: string }
      const externalId = data?.id != null ? String(data.id) : ''
      return { success: true, externalId }
    }

    return { success: false, error: `Gateway desconhecido: ${gateway.name}` }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

export type RefundResult = { success: true } | { success: false; error: string }


export async function refundAtGateway(
  gateway: Gateway,
  externalId: string
): Promise<RefundResult> {
  const baseUrl = getBaseUrl(gateway)
  if (!baseUrl) {
    return { success: false, error: `Gateway ${gateway.name} sem URL configurada` }
  }

  try {
    if (gateway.name === 'gateway1') {
      const res = await fetch(`${baseUrl}/transactions/${encodeURIComponent(externalId)}/charge_back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const text = await res.text()
        return { success: false, error: `${res.status} ${text || res.statusText}` }
      }
      return { success: true }
    }

    if (gateway.name === 'gateway2') {
      const res = await fetch(`${baseUrl}/transacoes/reembolso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: externalId }),
      })
      if (!res.ok) {
        const text = await res.text()
        return { success: false, error: `${res.status} ${text || res.statusText}` }
      }
      return { success: true }
    }

    return { success: false, error: `Gateway desconhecido: ${gateway.name}` }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
