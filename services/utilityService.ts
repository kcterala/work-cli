
export const getIpAddress = async () => {
    try {
        const response = await fetch('https://1.1.1.1/cdn-cgi/trace');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();

        const ip: string | undefined = data.match(/ip=([^\n]*)/)?.[1];
        const loc: string | undefined = data.match(/loc=([^\n]*)/)?.[1];

        if (ip && loc) {
            await copyToClipboard(ip)
            console.log(`${ip} (${loc}) (copied to clipboard)`);
        } else {
            console.log('Failed to parse IP information');
        }

    } catch (error) {
        console.error('Failed to get IP:', error);
    }
}

const copyToClipboard = async (text: string): Promise<void> => {
    try {
        let cmd: string[];
        if (process.platform === 'darwin') {
            cmd = ['pbcopy'];
        } else if (process.platform === 'linux') {
            cmd = ['xclip', '-selection', 'clipboard'];
        } else if (process.platform === 'win32') {
            cmd = ['clip'];
        } else {
            throw new Error('Unsupported platform');
        }
        const proc = Bun.spawn(cmd, {
            stdin: 'pipe'
        });
        proc.stdin.write(text);
        proc.stdin.end();
        await proc.exited;
    } catch (error) {
        console.log('Failed to copy to clipboard:', error);
        throw error; // Re-throw to let caller handle the failure
    }
};