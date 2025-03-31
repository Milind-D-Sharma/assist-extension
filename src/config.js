// Debug environment variables
console.log('Environment Variables:', {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? 'Present' : 'Missing',
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ? 'Present' : 'Missing',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Present' : 'Missing',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ? 'Present' : 'Missing',
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ? 'Present' : 'Missing',
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ? 'Present' : 'Missing'
}); 