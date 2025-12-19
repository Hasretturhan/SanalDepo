namespace SanalDepo.Api.Entities;

public class Slot
{
    public int Id { get; set; }
    public string Code { get; set; } = null!; // Örn: DEP-A/A1/R1/L1/S01

    public int RackLevelId { get; set; }
    public RackLevel RackLevel { get; set; } = null!;

    public ICollection<Box> Boxes { get; set; } = new List<Box>();
}
