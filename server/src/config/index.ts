export const config = {
  port: Number(process.env.PORT ?? 4000),
  db: {
    // Prefer IPv4 explicitly on Windows; localhost may resolve to ::1 while
    // local PostgreSQL installations are commonly bound only to 127.0.0.1.
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'ajay123',
    database: process.env.DB_NAME || 'airbus',
    port: Number(process.env.DB_PORT || 5432)
  },
  databaseUrl: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${encodeURIComponent(process.env.DB_PASSWORD || 'ajay123')}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'airbus'}`,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'maison_vela_super_secret_key_2026',
  commissions: {
    marketplaceRate: 0.12, // 12% for homeowner-managed listings
    managedRate: 0.22,     // 22% for fully serviced luxury villas
    guestServiceFeeRate: 0.12, // 12% guest service fee
    taxGstRate: 0.18       // 18% GST (Indian Hospitality Tax)
  }
}
