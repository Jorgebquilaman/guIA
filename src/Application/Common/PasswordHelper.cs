using System.Security.Cryptography;

namespace GuIA.Application.Common;

public static class PasswordHelper
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 100_000;

    public static string Hash(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize);

        byte[] result = new byte[SaltSize + HashSize];
        Array.Copy(salt, 0, result, 0, SaltSize);
        Array.Copy(hash, 0, result, SaltSize, HashSize);

        return Convert.ToBase64String(result);
    }

    public static bool Verify(string password, string hashedPassword)
    {
        byte[] bytes = Convert.FromBase64String(hashedPassword);
        byte[] salt = bytes[..SaltSize];
        byte[] hash = bytes[SaltSize..];

        byte[] computedHash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize);

        return CryptographicOperations.FixedTimeEquals(hash, computedHash);
    }
}
