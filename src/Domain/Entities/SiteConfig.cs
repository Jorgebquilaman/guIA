namespace GuIA.Domain.Entities;

public class SiteConfig : BaseEntity
{
    public bool ShowMessage { get; private set; }
    public string MessageText { get; private set; }
    public string? UpdatedBy { get; private set; }

    private SiteConfig() { MessageText = null!; }

    public SiteConfig(bool showMessage, string messageText)
    {
        ShowMessage = showMessage;
        MessageText = messageText;
    }

    public void Update(bool showMessage, string messageText, string? updatedBy = null)
    {
        ShowMessage = showMessage;
        MessageText = messageText;
        UpdatedBy = updatedBy;
    }
}
