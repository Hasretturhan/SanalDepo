namespace SanalDepo.Api.Entities;

public class RackLevel
{
    public int Id { get; set; }
    public int LevelNumber { get; set; }

    public int RackId { get; set; }
    public Rack Rack { get; set; } = null!;

    public ICollection<Slot> Slots { get; set; } = new List<Slot>();
}
