using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SanalDepo.Api.Data;
using SanalDepo.Api.Entities;

namespace SanalDepo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BoxesController : ControllerBase
{
    private readonly SanalDepoContext _context;

    public BoxesController(SanalDepoContext context)
    {
        _context = context;
    }

    public record CreateBoxRequest(
        string? BoxCode,
        string ProductName,
        int Quantity,
        int SlotId
    );

    public record UpdateBoxRequest(
        string ProductName,
        int Quantity
    );

    // GET: api/boxes  -> Admin paneli için tüm koliler
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Box>>> GetBoxes()
    {
        var boxes = await _context.Boxes
            .Include(b => b.Slot)
                .ThenInclude(s => s.RackLevel)
                    .ThenInclude(l => l.Rack)
                        .ThenInclude(r => r.Warehouse)
            .ToListAsync();

        return Ok(boxes);
    }

    // GET: api/boxes/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Box>> GetBox(int id)
    {
        var box = await _context.Boxes
            .Include(b => b.Slot)
                .ThenInclude(s => s.RackLevel)
                    .ThenInclude(l => l.Rack)
                        .ThenInclude(r => r.Warehouse)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (box == null)
            return NotFound();

        return Ok(box);
    }

    // POST: api/boxes  -> Yeni koli
    [HttpPost]
    public async Task<ActionResult<Box>> CreateBox(CreateBoxRequest request)
    {
        var slot = await _context.Slots.FindAsync(request.SlotId);
        if (slot == null)
        {
            return NotFound($"Slot {request.SlotId} bulunamadı.");
        }

        var boxCode = string.IsNullOrWhiteSpace(request.BoxCode)
            ? GenerateBoxCode()
            : request.BoxCode!;

        var exists = await _context.Boxes.AnyAsync(b => b.BoxCode == boxCode);
        if (exists)
        {
            return Conflict($"Bu BoxCode zaten kullanılıyor: {boxCode}");
        }

        var box = new Box
        {
            BoxCode = boxCode,
            ProductName = request.ProductName,
            Quantity = request.Quantity,
            SlotId = request.SlotId
        };

        _context.Boxes.Add(box);
        await _context.SaveChangesAsync();

        await _context.Entry(box).Reference(b => b.Slot!).LoadAsync();

        return CreatedAtAction(nameof(GetBox), new { id = box.Id }, box);
    }

    // PUT: api/boxes/5  -> Ürün adı / miktar güncelle
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateBox(int id, UpdateBoxRequest request)
    {
        var box = await _context.Boxes.FindAsync(id);
        if (box == null)
            return NotFound();

        box.ProductName = request.ProductName;
        box.Quantity = request.Quantity;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/boxes/5  -> Koli sil
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBox(int id)
    {
        var box = await _context.Boxes.FindAsync(id);
        if (box == null)
            return NotFound();

        _context.Boxes.Remove(box);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string GenerateBoxCode()
    {
        // QR/Barkod ID'si olarak benzersiz kod
        return "BOX-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
    }
}
