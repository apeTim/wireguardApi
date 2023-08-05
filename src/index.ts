import Koa from 'koa';
import Router from '@koa/router';
import fs from 'fs/promises'
import shell from 'shelljs'
import {generateKeyPair} from 'wireguard-tools'

const app = new Koa();
const router = new Router();

router.post('/api/create', async ctx => {
    const keys = await generateKeyPair()

    const rawSettings = await fs.readFile('./files/settings.json')
    const settings = JSON.parse(rawSettings.toString())
    const serverAddress = settings['serverAddress']
    const serverPublicKey = settings['serverPublicKey']
    const id = settings['lastConfigId'] + 1

    const data = '[Interface]\n' +
        `Address = 10.8.0.${id}/24\n` +
        `PrivateKey = ${keys.privateKey}\n` +
        'DNS = 1.1.1.1\n' +
        '\n' +
        '[Peer]\n' +
        `PublicKey = ${serverPublicKey}\n` +
        'AllowedIPs = 0.0.0.0/0\n' +
        `Endpoint = ${serverAddress}:51820\n` +
        'PersistentKeepalive = 21'

    shell.exec(`wg set wg0 peer ${keys.publicKey} allowed-ips 10.8.0.${id}`)

    settings['lastConfigId'] = id
    await fs.writeFile('./files/settings.json', JSON.stringify(settings))

    ctx.body = {
        id,
        data,
        publicKey: serverPublicKey
    }
})

app.use(router.routes())
    .use(router.allowedMethods());

app.listen(3000, () => console.log('Server has started'));