namespace GuIA.Domain.Entities;

public class SiteConfig : BaseEntity
{
    public bool ShowMessage { get; private set; }
    public string MessageText { get; private set; }
    public string? BaseUrl { get; private set; }
    public long? MaxFileSizeBytes { get; private set; }
    public string? UpdatedBy { get; private set; }

    private SiteConfig() { MessageText = null!; }

    public SiteConfig(bool showMessage, string messageText, string? baseUrl = null, long? maxFileSizeBytes = null)
    {
        ShowMessage = showMessage;
        MessageText = messageText;
        BaseUrl = baseUrl;
        MaxFileSizeBytes = maxFileSizeBytes;
    }

    public void Update(bool showMessage, string messageText, string? baseUrl = null, long? maxFileSizeBytes = null, string? updatedBy = null)
    {
        ShowMessage = showMessage;
        MessageText = messageText;
        BaseUrl = baseUrl;
        MaxFileSizeBytes = maxFileSizeBytes;
        UpdatedBy = updatedBy;
    }
}
