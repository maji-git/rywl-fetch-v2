const ttlib = require("./libs/timetables.js")
const fs = require("fs")
const docsCxt = JSON.parse(fs.readFileSync("public/app/docs-origin.json", "utf-8"))

async function main() {
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

    fs.writeFileSync("public/app/docs-origin.json", JSON.stringify(docsCxt, null, "\t"))
}

main()