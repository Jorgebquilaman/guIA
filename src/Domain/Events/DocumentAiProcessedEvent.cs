using MediatR;

namespace GuIA.Domain.Events;

public record DocumentAiProcessedEvent(Guid DocumentId) : INotification;
