import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// In a real app, this should be a strong, randomly generated secret stored in env
// For this example, if not provided we fallback, but you'd want a strict error normally.
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'a-very-secret-key-that-is-at-least-32-chars-long';

/**
 * Gets the 32-byte encryption key using scrypt
 */
const getKey = (salt: Buffer) => {
    return crypto.scryptSync(ENCRYPTION_SECRET, salt, KEY_LENGTH);
};

export const encrypt = (text: string): string => {
    // Generate a salt and an initialization vector
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Get the encryption key
    const key = getKey(salt);

    // Create the cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);

    // Get the authentication tag
    const tag = cipher.getAuthTag();

    // Combine everything into a single buffer
    const result = Buffer.concat([salt, iv, tag, encrypted]);

    // Return as a base64 string
    return result.toString('base64');
};

export const decrypt = (encryptedText: string): string => {
    try {
        // Convert the base64 string back to a buffer
        const buffer = Buffer.from(encryptedText, 'base64');

        // Extract the pieces
        const salt = buffer.subarray(0, SALT_LENGTH);
        const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

        // Get the decryption key
        const key = getKey(salt);

        // Create the decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        // Set the authentication tag
        decipher.setAuthTag(tag);

        // Decrypt the text
        const decrypted = decipher.update(encrypted) + decipher.final('utf8');

        return decrypted;
    } catch {
        throw new Error('Decryption failed');
    }
};
