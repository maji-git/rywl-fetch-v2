import * as ttlib from "../lib/timetables.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
const DOC_ORIGIN_PATH = path.resolve(__dirname, "../static_host/app/docs-origin.json")

async function main() {
    const docsCxt = JSON.parse(fs.readFileSync(DOC_ORIGIN_PATH, "utf-8"))

    const tt = await ttlib.getTimetables()

    for (const t of tt) {
        const originIndex = docsCxt.findIndex((e) => e.title == t.title)

        if (originIndex != -1) {
            docsCxt[originIndex]["title"] = t.title
            docsCxt[originIndex]["source"] = t.download
        } else {
            docsCxt.push({
                title: t.title,
                source: t.download
            })
        }
    }

    fs.writeFileSync(DOC_ORIGIN_PATH, JSON.stringify(docsCxt, null, "\t"))
}

main()