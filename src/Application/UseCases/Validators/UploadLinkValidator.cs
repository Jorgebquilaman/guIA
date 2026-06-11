using FluentValidation;
using GuIA.Application.UseCases.Documents;

namespace GuIA.Application.UseCases.Validators;

public class UploadLinkValidator : AbstractValidator<UploadLinkCommand>
{
    public UploadLinkValidator()
    {
        RuleFor(x => x.SourceUrl)
            .NotEmpty().WithMessage("Source URL is required.")
            .MaximumLength(2048).WithMessage("Source URL must not exceed 2048 characters.")
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _)).WithMessage("Source URL must be a valid absolute URL.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters.");

        RuleFor(x => x.CollectionId)
            .NotEmpty().WithMessage("Collection is required.");
    }
}
