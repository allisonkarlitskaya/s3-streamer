function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds));
}

function set_content(text) {
    document.getElementById('log').textContent = `\n${text}\n`;
}

async function fetch_from(url, offset) {
    for (let attempts = 0; attempts < 10; attempts++) {
        const options = {};

        if (offset) {
            options.headers = { Range: `bytes=${offset}-` };
        }

        try {
            const response = await fetch(url, options);
            if (response.ok) {
                const text = await response.text();
                if (offset && response.status != 206) {
                    return text.substring(offset);
                } else {
                    return text;
                }
            } else {
                return null;
            }
        } catch (error) {
            const delay = 2 ** attempts;
            console.log(`Failed to fetch ${url}.  Waiting ${delay}.`);
            await sleep(delay);
        }
    }

    console.log(`Giving up on ${url}.`);
    return null;
}

async function fetch_content(filename) {
    /* Content is unicode text, but we need to know how many bytes we have in
     * order to perform chunk calculations.  Track that separately.
     */
    let content = '';
    let bytes = 0;

    let chunks;
    while ((chunks = JSON.parse(await fetch_from(`${filename}.chunks`)))) {
        let chunk_start = 0;

        for (const chunk_size of chunks) {
            const chunk_end = chunk_start + chunk_size;

            if (bytes < chunk_end) {
                const offset = bytes - chunk_start;
                if ((chunk = await fetch_from(`${filename}.${chunk_start}-${chunk_end}`, offset))) {
                    bytes = chunk_end;
                    content += chunk;
                } else {
                    /* If we got nothing, it means the chunk was deleted on the server.
                     * That happens when the complete log is available.
                     */
                    break;
                }
            }

            chunk_start = chunk_end;
        }

        set_content(content);
        await sleep(1);
    }

    content += await fetch_from(filename, content.length);
    set_content(content);

    console.log('Thank you for using s3-streamer.  Have a nice day.')
}

fetch_content('log');
