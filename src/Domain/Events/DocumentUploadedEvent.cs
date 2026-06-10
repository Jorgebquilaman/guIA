using MediatR;

namespace GuIA.Domain.Events;

public record DocumentUploadedEvent(Guid DocumentId) : INotification;
