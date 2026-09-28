import localtunnel from 'localtunnel';

async function start() {
  try {
    const tunnel = await localtunnel({
      port: 8443,
      subdomain: 'lux-mauritius-2026',
    });
    console.log('Tunnel online at:', tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel closed. Reconnecting in 3s...');
      setTimeout(start, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err.message);
    });
  } catch (err) {
    console.error('Connection failed, retrying in 5s:', err.message);
    setTimeout(start, 5000);
  }
}

start();
