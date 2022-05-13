function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds));
}

function set_content(text) {
    document.getElementById('log').textContent = `\n${text}\n`;
}

async function fetch_from(url, offset) {
    for (let attempts = 0; attempts < 10; attempts++) {
        options = {};

        if (offset) {
            options.headers = {range: `bytes=${offset}-`};
        }

        try {
            const response = await fetch(url, options);
            if (response.ok) {
                text = await response.text();
                text = text.substring(offset);  /* HACK: python http.server doesn't do Range */
                return text;
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
    let content = '';

    while (chunks = JSON.parse(await fetch_from(`${filename}.chunks`))) {
        let chunk_start = 0;

        for (const chunk_size of chunks) {
            const chunk_end = chunk_start + chunk_size;

            if (content.length < chunk_end) {
                const offset = content.length - chunk_start;
                content += await fetch_from(`${filename}.${chunk_start}-${chunk_end}`, offset);
                if (content.length != chunk_end) {
                    console.log('Oops!  No range support?');
                    return;
                }
            }

            chunk_start = chunk_end;
        }

        set_content(content);
        await sleep(1);
    }

    content += await fetch_from(filename, content.length);
    set_content(content);
}

fetch_content('log');
