using System.Threading.Channels;

namespace GuIA.Infrastructure.Adapters;

public class AiProcessingQueue
{
    private readonly Channel<Guid> _channel = Channel.CreateBounded<Guid>(new BoundedChannelOptions(100)
    {
        FullMode = BoundedChannelFullMode.Wait,
        SingleWriter = false,
        SingleReader = true
    });

    public ChannelWriter<Guid> Writer => _channel.Writer;
    public ChannelReader<Guid> Reader => _channel.Reader;
}
