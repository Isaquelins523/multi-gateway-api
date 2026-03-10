/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessToken: {
      store: typeof routes['auth.access_token.store']
      destroy: typeof routes['auth.access_token.destroy']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
  }
  purchase: {
    store: typeof routes['purchase.store']
    index: typeof routes['purchase.index']
    show: typeof routes['purchase.show']
    refund: typeof routes['purchase.refund']
  }
  clients: {
    index: typeof routes['clients.index']
    show: typeof routes['clients.show']
  }
  gateways: {
    index: typeof routes['gateways.index']
    show: typeof routes['gateways.show']
    update: typeof routes['gateways.update']
  }
  products: {
    index: typeof routes['products.index']
    store: typeof routes['products.store']
    show: typeof routes['products.show']
    update: typeof routes['products.update']
    destroy: typeof routes['products.destroy']
  }
  users: {
    index: typeof routes['users.index']
    store: typeof routes['users.store']
    show: typeof routes['users.show']
    update: typeof routes['users.update']
    destroy: typeof routes['users.destroy']
  }
}
