import { IgApiClient } from 'instagram-private-api';
import config from './config.js'
import * as Blynk from './blynk.js'

/**
 * @type {IgApiClient}
 */
export let ig;

export const lookupSources = [];

const delay = (delayInms) => {
    return new Promise(resolve => setTimeout(resolve, delayInms));
};

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

const delayIGRandom = () => {
    return new Promise(resolve => setTimeout(resolve, getRandomArbitrary(3000, 5000)));
};

const igSources = [
    "rywstudentcouncil",
    "ryw_library"
]

export async function init() {
    ig = new IgApiClient()
    ig.state.generateDevice(config.IG_USERNAME)

    try {
        await ig.simulate.preLoginFlow();

        const loggedInUser = await ig.account.login(config.IG_USERNAME, config.IG_PASSWORD)

        Blynk.writeConsole(`IG Logged in as ${loggedInUser.username}`)
    } catch (err) {
        console.error("IG ERROR: ", err)
    }



    //await delayIGRandom()

    /*

    console.log("Looking up Sources")

    try {
        for (const i of igSources) {
            console.log("Loading Up IG: ", i)
            lookupSources.push((await ig.user.lookup({
                query: i
            })))
            await delayIGRandom()
        }
    } catch (error) {
        let error_type = error.response.body.error_type;
        switch (error_type) {
            case 'checkpoint_challenge_required':
                console.log("Challange Required")
                await ig.challenge.auto(true); // Requesting sms-code or click "It was me" button

                break;
            case 'feedback_required':
                console.log("Feedback Required")

                break;
            case 'ip_block':
        }

        console.error(error)

        return error.response.body;
    }
        */
}

export async function getPostFromSources() {
    return []
    /*
    let result = []
    for (const s of lookupSources) {
        await delayIGRandom()

        const userFeed = ig.feed.user(s.user.pk)

        const feedPages = await userFeed.items();

        result.push(...feedPages)

        console.log("Feed Loaded: ", s.user.username)
    }

    return result
    */
}

export async function postImg(buffer, caption) {
    if (!ig) {
        console.error("IG not available")
        return
    }

    console.log("Publishing")
    await ig.publish.photo({
        file: buffer,
        caption: caption
    })

    console.log("IG Posted")
}