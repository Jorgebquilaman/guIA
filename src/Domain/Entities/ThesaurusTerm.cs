using GuIA.Domain.Enums;
using GuIA.Domain.Exceptions;
using System;
using System.Collections.Generic;

namespace GuIA.Domain.Entities;

public class ThesaurusTerm : BaseEntity
{
    private readonly List<ThesaurusTerm> _broaderTerms = new();
    private readonly List<ThesaurusTerm> _narrowerTerms = new();
    private readonly List<ThesaurusTerm> _synonyms = new();
    private readonly List<ThesaurusTerm> _relatedTerms = new();
    private readonly List<ThesaurusTerm> _childThesauri = new();

    private ThesaurusTerm() { }

    public ThesaurusTerm(
        string preferredLabel,
        LanguageCode language,
        ThesaurusType type,
        string? altLabel = null,
        string? definition = null,
        ThesaurusTerm? broaderTerm = null,
        ThesaurusTerm? parentThesaurus = null)
    {
        if (string.IsNullOrWhiteSpace(preferredLabel))
            throw new DomainValidationException("Preferred label cannot be empty.");
        if (language == null)
            throw new DomainValidationException("Language cannot be null.");

        PreferredLabel = preferredLabel;
        Language = language;
        Type = type;
        AltLabel = altLabel;
        Definition = definition;
        SetBroaderTerm(broaderTerm);
        SetParentThesaurus(parentThesaurus);
    }

    public ThesaurusTerm(
        string preferredLabel,
        LanguageCode language,
        ThesaurusType type,
        string? altLabel = null,
        string? definition = null)
        : this(preferredLabel, language, type, altLabel, definition, null, null)
    {
    }

    public string PreferredLabel { get; private set; }
    public LanguageCode Language { get; private set; }
    public ThesaurusType Type { get; private set; }
    public string? AltLabel { get; private set; }
    public string? Definition { get; private set; }
    public IReadOnlyCollection<ThesaurusTerm> BroaderTerms => _broaderTerms.AsReadOnly();
    public IReadOnlyCollection<ThesaurusTerm> NarrowerTerms => _narrowerTerms.AsReadOnly();
    public IReadOnlyCollection<ThesaurusTerm> Synonyms => _synonyms.AsReadOnly();
    public IReadOnlyCollection<ThesaurusTerm> RelatedTerms => _relatedTerms.AsReadOnly();
    public ThesaurusTerm? ParentThesaurus { get; private set; }
    public IReadOnlyCollection<ThesaurusTerm> ChildThesauri => _childThesauri.AsReadOnly();
    public bool IsActive { get; private set; } = true;
    public DateTime? EffectiveDate { get; private set; }
    public DateTime? RetirementDate { get; private set; }

    public void Update(
        string preferredLabel,
        LanguageCode language,
        ThesaurusType type,
        string? altLabel,
        string? definition,
        ThesaurusTerm? broaderTerm,
        bool isActive)
    {
        if (string.IsNullOrWhiteSpace(preferredLabel))
            throw new DomainValidationException("Preferred label cannot be empty.");
        if (language == null)
            throw new DomainValidationException("Language cannot be null.");

        PreferredLabel = preferredLabel;
        Language = language;
        Type = type;
        AltLabel = altLabel;
        Definition = definition;
        SetBroaderTerm(broaderTerm);
        IsActive = isActive;
        MarkAsUpdated();
    }

    public void SetBroaderTerm(ThesaurusTerm? broaderTerm)
    {
        if (broaderTerm == this)
            throw new DomainValidationException("Term cannot be its own broader term.");

        var oldBroader = _broaderTerms.FirstOrDefault();
        if (oldBroader != null)
            _broaderTerms.Remove(oldBroader);

        if (broaderTerm != null)
            _broaderTerms.Add(broaderTerm);
    }

    public void AddNarrowerTerm(ThesaurusTerm narrowerTerm)
    {
        if (narrowerTerm == this)
            throw new DomainValidationException("Term cannot be its own narrower term.");

        narrowerTerm.SetBroaderTerm(this);
    }

    public void AddSynonym(Guid synonymId)
    {
        _synonyms.Add(new ThesaurusTerm { Id = synonymId });
    }

    public void AddRelatedTerm(Guid relatedId)
    {
        _relatedTerms.Add(new ThesaurusTerm { Id = relatedId });
    }

    public void SetParentThesaurus(ThesaurusTerm? parent)
    {
        var oldParent = ParentThesaurus;
        if (oldParent != null)
            _childThesauri.Remove(oldParent);

        if (parent != null)
        {
            _childThesauri.Add(parent);
            parent.SetChildThesaurus(this);
        }
    }

    private void SetChildThesaurus(ThesaurusTerm child)
    {
        if (child.ParentThesaurus != this)
        {
            var oldChild = _childThesauri.FirstOrDefault(c => c.Id == child.Id);
            if (oldChild != null)
                _childThesauri.Remove(oldChild);
            _childThesauri.Add(child);
            child.ParentThesaurus = this;
        }
    }

    public void Deactivate()
    {
        IsActive = false;
        RetirementDate = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void Reactivate()
    {
        IsActive = true;
        RetirementDate = null;
        MarkAsUpdated();
    }
}