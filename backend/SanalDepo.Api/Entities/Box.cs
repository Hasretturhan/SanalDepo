namespace SanalDepo.Api.Entities;

public class Box
{
    public int Id { get; set; }
    public string BoxCode { get; set; } = null!;   // QR/Barkod ID: BOX-00000123
    public string? ProductName { get; set; }
    public int Quantity { get; set; }

    public int? SlotId { get; set; }              // Henüz rafa konmadıysa null olabilir
    public Slot? Slot { get; set; }
}
