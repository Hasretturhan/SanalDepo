namespace SanalDepo.Api.Entities;

public class Rack
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;

    public int WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;

    public ICollection<RackLevel> Levels { get; set; } = new List<RackLevel>();
}
