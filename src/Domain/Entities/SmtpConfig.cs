namespace GuIA.Domain.Entities;

public class SmtpConfig : BaseEntity
{
    public string Host { get; private set; }
    public int Port { get; private set; }
    public string Username { get; private set; }
    public string Password { get; private set; }
    public string FromEmail { get; private set; }
    public string FromName { get; private set; }
    public bool UseSsl { get; private set; }
    public string? UpdatedBy { get; private set; }

    private SmtpConfig() { Host = null!; Username = null!; Password = null!; FromEmail = null!; FromName = null!; }

    public SmtpConfig(string host, int port, string username, string password, string fromEmail, string fromName, bool useSsl)
    {
        Host = host;
        Port = port;
        Username = username;
        Password = password;
        FromEmail = fromEmail;
        FromName = fromName;
        UseSsl = useSsl;
    }

    public void Update(string host, int port, string username, string password, string fromEmail, string fromName, bool useSsl, string? updatedBy = null)
    {
        Host = host;
        Port = port;
        Username = username;
        Password = password;
        FromEmail = fromEmail;
        FromName = fromName;
        UseSsl = useSsl;
        UpdatedBy = updatedBy;
    }
}
