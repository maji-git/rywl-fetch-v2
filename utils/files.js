import { compress, decompress } from "./compression.js"
import { writeFile } from 'fs-web';

export async function storeUserImage() {
    if (window.isNative) {

    } else {
    }
}

export async function pickMedia() {
    return new Promise((resolve) => {
        const input = document.createElement("input")
        input.setAttribute("type", "file")
        input.setAttribute("accept", "image/png, image/jpeg")

        input.click()

        const reader = new FileReader();

        reader.onload = async () => {
            const contents = reader.result;

            await writeFile(`pfps/${new Date().getTime()}`, (await compress(contents, "gzip")))
            resolve()
        };

        input.addEventListener("change", () => {
            if (input.files[0]) {
                reader.readAsDataURL(input.files[0]);
            }

            input.remove()
        })
    })
}