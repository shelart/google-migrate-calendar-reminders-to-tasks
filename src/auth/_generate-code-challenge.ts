import {randomInt, createHash} from 'crypto';

const charactersPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
const codeLength = 43;

type CodeVerifierAndChallenge = {
    codeVerifier: string;
    codeChallenge: string;
};

export default function (): CodeVerifierAndChallenge {
    let result = [];
    for (let i = 1; i <= codeLength; ++i) {
        result.push(charactersPool.charAt(randomInt(charactersPool.length)));
    }
    const codeVerifier = result.join('');

    const sha256 = createHash('sha256').update(codeVerifier, 'ascii').digest();
    const codeChallenge = sha256.toString('base64url');

    return {codeVerifier, codeChallenge};
}
