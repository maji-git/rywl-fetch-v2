import { CapacitorHttp } from '@capacitor/core';

export async function downloadFile(targetURL) {
    if (targetURL.startsWith("data")) {
        return targetURL
    }

    let destination = targetURL
    if (!window.isNative) {
        destination = destination.replace("https://rayongwit.ac.th", window.rywlAPIs.main + "/serve")
    }

    //http://localhost:3000

    const db = await CapacitorHttp.get({
        url: destination,
        responseType: "arraybuffer"
    });

    return `data:${db.headers['Content-Type']};base64,${db.data.replace("\n", "")}`
}

export function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    let byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    let ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    let ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    let blob = new Blob([ab], { type: mimeString });
    return blob;
}

export async function downloadFileBlob(targetURL, contentType) {
    let db = await downloadFile(targetURL)
    let blob = dataURItoBlob(db)

    if (contentType) {
        blob = blob.slice(0, blob.size, contentType)
    }

    return blob
}