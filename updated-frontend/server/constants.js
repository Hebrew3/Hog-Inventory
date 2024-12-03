export class Status {
    static OK = 200;
    static CREATED = 201;
    static BAD_REQUEST = 400;
    static UNAUTHORIZED = 401;
    static FORBIDDEN = 403;
    static NOT_FOUND = 404;
    static TOO_MANY_ATTEMPTS = 429;
    static INTERNAL_SERVER_ERROR = 500;
}

export const ProfilePic = 'data:image/jpeg;base64,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TlGGGBptbF3aC4TIwHHQ+tZDqykqwIIOCD2oASiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKVFZiFUEknAA70ALHGZXCKMsTW1bW628QUck8k+tR2loLdMnBc9T6VZoAKKKKACiiigAooooAKKKKACq13aLcLkYDjofWrNFAGBJG0TlXBDDsabW3cWyXCYYcjoR2rKuLaSA4YZU9GHegCGiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiipre2knOFGFHVj2oAjjjaVwqAlj2Fa1paLbrk4LnqfSn29slumFHJ6k96moAKKKKACiiigAooooAKKKKACiiigAooooAKQgOpVgCD1BpaKAM+403q0J/4Caz3VkJVgQR1BGK6Co5YY5lxIoPpQBhUVfm0xhkwtkf3TVKSJ4jh0ZfqOtADaKKKACiiigAooooAKKKKACiiigAoop0cTynCIzfQdKAG0qKzkKoJJ6ADNXodMY4MzYH90VeihjhXEagetAFO303o0x/4CKvgBFCqAAOgFLRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUEAjBAI9DRRQBWksIJP4dp9VOKrPpZ/gkB9iKKKAIJLGePkqCPUNVcgg4PWiigAooooAKACTgdaKKALEdjPJyFAHqWqdNLP8cgHsBRRQBZjsII/4dx9WOasgADAAA9BRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQB//9k=';

export const port = process.env.PORT || 3000;
export const secretKey = process.env.SESSION_KEY || 'secretkeysystemm'; 
export const dbConnectionString = process.env.DB_CONN || 'mongodb+srv://systemm:systemm@systemm.vhd1l.mongodb.net/';

export const productStatus = {
    AVAILABLE: 'Available',
    OUTOFSTOCK: 'Out of Stock'
}

