namespace SanalDepo.Api.Entities;

public class Warehouse
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Code { get; set; }
    public string? Address { get; set; }

    public ICollection<Rack> Racks { get; set; } = new List<Rack>();
}
