import { pdf } from "pdf-to-img"
import fs from "fs"
import axios from "axios"

const originDoc = JSON.parse(fs.readFileSync("static_host/app/docs-origin.json", "utf-8"))

export async function genDocThumbnails() {
    let docID = -1

    for (const od of originDoc) {
        docID++

        if (!od.source.endsWith(".pdf")) {
            originDoc[docID]['isPDF'] = false
            continue
        }

        originDoc[docID]['isPDF'] = true

        const pdfRes = await axios.get(od.source, { responseType: "arraybuffer" })
        fs.writeFileSync("temp.pdf", pdfRes.data)
        const doc = await pdf("temp.pdf", { scale: 0.7 })

        for await (const page of doc) {
            fs.writeFileSync(`static_host/app/doc-thumbnails/${docID}.png`, page)
            break
        }

        originDoc[docID]['thumbnail'] = `${docID}.png`
    }

    fs.writeFileSync("static_host/app/docs.json", JSON.stringify(originDoc))
}