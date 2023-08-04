import Koa from 'koa';
import Router from '@koa/router';
import fs from 'fs/promises'
import shell from 'shelljs'
import {generateKeyPair} from 'wireguard-tools'

const app = new Koa();
const router = new Router();

router.post('/api/create', async ctx => {
    const keys = await generateKeyPair()

    const rawData = await fs.readFile('./files/data.json')
    const data = JSON.parse(rawData.toString())
    const serverAddress = data['serverAddress']
    const serverPublicKey = data['serverPublicKey']
    const configId = data['lastConfigId'] + 1

    const config = '[Interface]\n' +
        `Address = 10.8.0.${configId}/24\n` +
        `PrivateKey = ${keys.privateKey}\n` +
        'DNS = 1.1.1.1\n' +
        '\n' +
        '[Peer]\n' +
        `PublicKey = ${serverPublicKey}\n` +
        'AllowedIPs = 0.0.0.0/0, ::/0\n' +
        `Endpoint = ${serverAddress}:51820\n` +
        'PersistentKeepalive = 21'

    shell.exec(`wg set wg0 peer ${keys.publicKey} allowed-ips 10.8.0.${configId}`)

    data['lastConfigId'] = configId
    await fs.writeFile('./files/data.json', JSON.stringify(data))

    ctx.body = {
        config
    }
})

app.use(router.routes())
    .use(router.allowedMethods());

app.listen(3000, () => console.log('Server has started'));