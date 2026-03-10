/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'


router.get('/', () => {
  return { hello: 'world' }
})



router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.auth.NewAccount, 'store'])
        router.post('login', [controllers.auth.AccessToken, 'store'])
        router.post('logout', [controllers.auth.AccessToken, 'destroy']).use(middleware.auth())
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.account.Profile, 'show'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router.post('purchases', [controllers.purchases.Purchase, 'store'])

    router
      .group(() => {
        router.get('purchases', [controllers.purchases.Purchase, 'index'])
        router.get('purchases/:id', [controllers.purchases.Purchase, 'show'])
        router.post('purchases/:id/refund', [controllers.purchases.Purchase, 'refund'])
      })
      .use([middleware.auth(), middleware.roles({ roles: ['admin'] })])

    router
      .group(() => {
        router.get('clients', [controllers.clients.Clients, 'index'])
        router.get('clients/:id', [controllers.clients.Clients, 'show'])
      })
      .use([middleware.auth(), middleware.roles({ roles: ['admin'] })])

    router
      .group(() => {
        router.get('gateways', [controllers.gateways.Gateways, 'index'])
        router.get('gateways/:id', [controllers.gateways.Gateways, 'show'])
        router.patch('gateways/:id', [controllers.gateways.Gateways, 'update'])
      })
      .use([middleware.auth(), middleware.roles({ roles: ['admin'] })])

    router
      .resource('products', controllers.products.Products)
      .apiOnly()
      .use(['index', 'show'], middleware.auth())
      .use(['store', 'update', 'destroy'], [middleware.auth(), middleware.roles({ roles: ['admin'] })])

    router
      .resource('users', controllers.users.Users)
      .apiOnly()
      .use('*', [middleware.auth(), middleware.roles({ roles: ['admin'] })])
  })
  .prefix('/api/v1')
