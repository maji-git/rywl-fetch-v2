const igPFPS = {
    "rywstudentcouncil": "/app/static/ig_pfp/rywstudentcouncil.jpg",
    "ryw_library": "/app/static/ig_pfp/ryw_library.jpg",
}

const DIVISIONS = [
    { amount: 60, name: "seconds" },
    { amount: 60, name: "minutes" },
    { amount: 24, name: "hours" },
    { amount: 7, name: "days" },
    { amount: 4.34524, name: "weeks" },
    { amount: 12, name: "months" },
    { amount: Number.POSITIVE_INFINITY, name: "years" },
]

const formatterTH = new Intl.RelativeTimeFormat('th', {numeric: "auto"})

function formatTimeAgo(date) {
    let duration = (date - new Date()) / 1000

    for (let i = 0; i < DIVISIONS.length; i++) {
        const division = DIVISIONS[i]
        if (Math.abs(duration) < division.amount) {
            return formatterTH.format(Math.round(duration), division.name)
        }
        duration /= division.amount
    }
}

export async function newssum(announcements, igFeed) {
    console.log(igFeed)
    const result = {}
    const formatter = new Intl.DateTimeFormat('en-US')

    for (const a of announcements) {
        const dateTime = new Date(a.dateTime)
        const dateTimeStr = formatter.format(dateTime)
        if (!result[dateTimeStr]) {
            result[dateTimeStr] = {
                dateTime: dateTime,
                displayTitle: formatTimeAgo(dateTime),
                timeFormat: formatter.format(dateTime),
                values: [],
            }
        }

        result[dateTimeStr].values.push({
            title: a.title,
            link: a.article,
            summedTitle: a.summedTitle ?? null,
            useAI: a.summedTitle ? true : false,
            source: "web"
        })
    }

    for (const a of igFeed) {
        try {
            const dateTime = new Date()
            dateTime.setTime(a.caption.created_at * 1000)
            const dateTimeStr = formatter.format(dateTime)
            if (!result[dateTimeStr]) {
                result[dateTimeStr] = {
                    dateTime: dateTime,
                    displayTitle: formatTimeAgo(dateTime),
                    timeFormat: formatter.format(dateTime),
                    values: [],
                }
            }

            result[dateTimeStr].values.push({
                title: `โพสต์ใหม่จาก ${a.owner.username ?? 'IG'}`,
                details: a.caption.text,
                link: `https://www.instagram.com/p/${a.code ?? 'null'}/?img_index=1`,
                pfp: igPFPS[a.owner.username] ?? null,
                author: a.owner?.username,
                summedTitle: null,
                useAI: false,
                img: a.carousel_media?.image_versions2?.candidates[0]?.url ?? null,
                source: "ig"
            })
        } catch (err) {
            console.error(err)
        }
    }

    const ordered = Object.values(result).sort(function (a, b) {
        return new Date(b.displayTitle) - new Date(a.displayTitle);
    });

    return ordered
}