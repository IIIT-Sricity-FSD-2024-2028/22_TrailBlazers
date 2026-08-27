import * as path from 'path';

export default () => ({
  expressPort: parseInt(process.env.PORT, 10) || 5000,
  nestPort: parseInt(process.env.NEST_PORT, 10) || 5001,
  jwtSecret: process.env.JWT_SECRET || 'ffsd-event-platform-secret-key-2026',
  database: {
    filename: process.env.DB_PATH || path.join(process.cwd(), 'ffsd_events.db'),
  },
  logs: {
    directory: path.join(process.cwd(), 'logs'),
  },
});
