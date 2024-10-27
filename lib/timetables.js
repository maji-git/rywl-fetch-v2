import axios from "axios"
import { JSDOM } from "jsdom"

const url = "https://rayongwit.ac.th/%e0%b8%95%e0%b8%b2%e0%b8%a3%e0%b8%b2%e0%b8%872-67/"

export async function getTimetables() {
    const res = await axios.get(url)
    const dom = new JSDOM(res.data, {})
    const document = dom.window.document;

    const result = []

    for (const element of document.querySelectorAll(".wp-block-file")) {
        const title = element.querySelector("a")
        const download = element.querySelector(".wp-block-file__button")

        if (title && download) {
            result.push({
                title: title.innerHTML.trim(),
                download: download.getAttribute("href"),
            })
        }
    }
    return result
}