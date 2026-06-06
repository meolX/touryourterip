import app from './app.js';
import config from './src/config/index.js';

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`\n🚀 TourYourTrip API Server`);
  console.log(`   Environment : ${config.NODE_ENV}`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   Health      : http://localhost:${PORT}/health`);
  console.log(`   Auth API    : http://localhost:${PORT}/api/v1/auth\n`);
});
