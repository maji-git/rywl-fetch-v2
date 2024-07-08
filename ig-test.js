import { IgApiClient } from 'instagram-private-api';
import config from './config.js'
import fs from 'fs'

/**
 * @type {IgApiClient}
 */
let ig;

const delay = (delayInms) => {
    return new Promise(resolve => setTimeout(resolve, delayInms));
};

export async function main() {
    ig = new IgApiClient()
    ig.state.generateDevice(config.IG_USERNAME)

    console.log(`Logging in...`)

    try {
        await ig.simulate.preLoginFlow();

        const loggedInUser = await ig.account.login(config.IG_USERNAME, config.IG_PASSWORD)

        console.log(`IG Logged in as ${loggedInUser.username}`)
    } catch (err) {
        console.error("IG ERROR: ", err)
    }

    console.log("Auth")

    await delay(2000)

    let rywcouncilID = await ig.user.lookup({
        query: "rywstudentcouncil"
    })
    console.log("RYWLOOKUP: ", rywcouncilID)
    console.log(rywcouncilID.user)
}

main()