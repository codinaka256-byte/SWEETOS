const webpush = require('web-push');

console.log('Generating secure VAPID Keys for SWEETOS Store push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('================================================================');
console.log('🔑 PUBLIC KEY (Put this in Vercel Env: VAPID_PUBLIC_KEY)');
console.log('================================================================');
console.log(vapidKeys.publicKey);
console.log('\n================================================================');
console.log('🔑 PRIVATE KEY (Put this in Vercel Env: VAPID_PRIVATE_KEY)');
console.log('================================================================');
console.log(vapidKeys.privateKey);
console.log('\n================================================================');
console.log('💡 TIP: Save these in your Vercel Dashboard env variables for secure persistence!');
console.log('================================================================');
