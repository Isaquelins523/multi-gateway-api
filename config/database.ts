import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  // Em ambiente de teste usamos SQLite para facilitar os testes automatizados
  connection: app.inTest ? 'sqlite' : env.get('DB_CONNECTION') ?? 'mysql',

  connections: {
    mysql: {
      client: 'mysql2',

      connection: {
        host: env.get('MYSQL_HOST'),
        port: parseInt(env.get('MYSQL_PORT') ?? '3306'),
        user: env.get('MYSQL_USER'),
        password: env.get('MYSQL_PASSWORD'),
        database: env.get('MYSQL_DB_NAME'),
      },

      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },

      debug: app.inDev,
    },

    sqlite: {
      client: 'better-sqlite3',

      connection: {
        filename: app.tmpPath('db.sqlite3'),
      },

      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },

      useNullAsDefault: true,
      debug: app.inDev,
    },
  },
})

export default dbConfig