using FluentValidation;
using GuIA.Application.UseCases.Collections;

namespace GuIA.Application.UseCases.Validators;

public class CreateCollectionValidator : AbstractValidator<CreateCollectionCommand>
{
    public CreateCollectionValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Collection name is required.")
            .MaximumLength(200).WithMessage("Collection name must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");
    }
}
