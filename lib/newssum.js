export async function newssum(announcements) {
    const result = {}
    const formatter = new Intl.DateTimeFormat('en-US')

    for (const a of announcements) {
        const dateTime = new Date(a.dateTime)
        const dateTimeStr = dateTime.getTime().toString()
        if (!result[dateTimeStr]) {
            result[dateTimeStr] = {
                dateTime: dateTime,
                displayTitle: formatter.format(dateTime),
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
    const ordered = Object.keys(result).sort(function (a, b) {
        return new Date(b) - new Date(a);
    }).reduce(
        (obj, key) => {
            obj[key] = result[key];
            return obj;
        },
        {}
    );

    return ordered
}