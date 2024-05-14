import axios from "axios"
import jsdom from "jsdom"
const { JSDOM } = jsdom;

const doTheJob = async (method, options) => {
    const res = await axios.request({
        url: options.url
    })

    return {
        data: res.data,
        headers: {},
        cookie: res.headers["set-cookie"],
        status: res.status,
        url: options.url
    }
}

export class DOMParser {
    parseFromString(str) {
        return (new JSDOM(str)).window.document
    }
}

const RYWLHttpHandler = {
    post: async (options) => {
        return (await doTheJob("post", options))
    },
    get: async (options) => {
        return (await doTheJob("get", options))
    },
}

export const RYWLHttp = RYWLHttpHandler