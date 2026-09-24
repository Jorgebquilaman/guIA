namespace GuIA.Domain.Entities;

public class AuthorMetadataSettings : BaseEntity
{
    public string ConsentText { get; private set; } = null!;

    private AuthorMetadataSettings() { }

    public AuthorMetadataSettings(string consentText)
    {
        ConsentText = consentText;
    }

    public void UpdateConsentText(string consentText)
    {
        ConsentText = consentText;
        MarkAsUpdated();
    }
}
