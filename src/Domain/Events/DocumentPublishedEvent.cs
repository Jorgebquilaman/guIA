using MediatR;

namespace GuIA.Domain.Events;

public record DocumentPublishedEvent(Guid DocumentId, DateTime PublishedAt) : INotification;
