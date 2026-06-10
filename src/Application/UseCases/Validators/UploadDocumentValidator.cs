using FluentValidation;
using GuIA.Application.UseCases.Documents;

namespace GuIA.Application.UseCases.Validators;

public class UploadDocumentValidator : AbstractValidator<UploadDocumentCommand>
{
    public UploadDocumentValidator()
    {
        RuleFor(x => x.Files)
            .NotEmpty().WithMessage("At least one file is required.");

        RuleFor(x => x.CollectionId)
            .NotEmpty().WithMessage("Collection is required.");

        RuleFor(x => x.Files)
            .Must(files => files.All(f => !string.IsNullOrWhiteSpace(f.FileName)))
            .WithMessage("All files must have a name.");

        RuleFor(x => x.Title)
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters.");
    }
}
