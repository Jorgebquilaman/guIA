namespace GuIA.Domain.Entities;

public class SiteConfig : BaseEntity
{
    public bool ShowMessage { get; private set; }
    public string MessageText { get; private set; }
    public string? BaseUrl { get; private set; }
    public string? UpdatedBy { get; private set; }

    private SiteConfig() { MessageText = null!; }

    public SiteConfig(bool showMessage, string messageText, string? baseUrl = null)
    {
        ShowMessage = showMessage;
        MessageText = messageText;
        BaseUrl = baseUrl;
    }

    public void Update(bool showMessage, string messageText, string? baseUrl = null, string? updatedBy = null)
    {
        ShowMessage = showMessage;
        MessageText = messageText;
        BaseUrl = baseUrl;
        UpdatedBy = updatedBy;
    }
}
