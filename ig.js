import { IgApiClient } from 'instagram-private-api';
import config from './config.js'
import * as Blynk from './blynk.js'

/**
 * @type {IgApiClient}
 */
let ig;

export async function init() {
    ig = new IgApiClient()
    ig.state.generateDevice(config.IG_USERNAME)

    await ig.simulate.preLoginFlow();

    const loggedInUser = await ig.account.login(config.IG_USERNAME, config.IG_PASSWORD)

    Blynk.writeConsole(`IG Logged in as ${loggedInUser.username}`)
}

export async function postImg(buffer, caption) {
    if (!ig) {
        console.error("IG not available, forwarding reauth")
        init()
        return
    }

    console.log("Publishing")
    await ig.publish.photo({
        file: buffer,
        caption: caption
    })

    console.log("IG Posted")
}