const motor = String(
  process.env.DB_MOTOR || (process.env.DATABASE_URL ? 'postgres' : 'sqlite'),
).toLowerCase();

module.exports = motor === 'postgres'
  ? require('./db-postgres')
  : require('./db-sqlite');
