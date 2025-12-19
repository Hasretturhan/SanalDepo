using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SanalDepo.Api.Data;
using SanalDepo.Api.Entities;

namespace SanalDepo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RacksController : ControllerBase
{
    private readonly SanalDepoContext _context;

    public RacksController(SanalDepoContext context)
    {
        _context = context;
    }

    // Raf oluşturmak için kullanacağımız istek modeli
    public record CreateRackRequest(
        int WarehouseId,
        string Code,
        int LevelCount,      // Kaç kat/level olacak
        int SlotsPerLevel    // Her level'da kaç göz olacak
    );

    // POST: api/racks
    [HttpPost]
    public async Task<ActionResult<Rack>> CreateRack(CreateRackRequest request)
    {
        // Depo var mı kontrol et
        var warehouse = await _context.Warehouses.FindAsync(request.WarehouseId);
        if (warehouse == null)
        {
            return NotFound($"Warehouse {request.WarehouseId} bulunamadı.");
        }

        // Yeni raf
        var rack = new Rack
        {
            Code = request.Code,
            WarehouseId = request.WarehouseId
        };

        // Level + Slot'ları otomatik oluştur
        for (int levelNo = 1; levelNo <= request.LevelCount; levelNo++)
        {
            var level = new RackLevel
            {
                LevelNumber = levelNo,
                Rack = rack
            };

            for (int slotNo = 1; slotNo <= request.SlotsPerLevel; slotNo++)
            {
                // Örn: DEP-A-R1-L01-S03
                var slotCode =
                    $"{warehouse.Code ?? "DEP"}-{rack.Code}-L{levelNo:D2}-S{slotNo:D2}";

                var slot = new Slot
                {
                    Code = slotCode,
                    RackLevel = level
                };

                level.Slots.Add(slot);
            }

            rack.Levels.Add(level);
        }

        _context.Racks.Add(rack);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRack), new { id = rack.Id }, rack);
    }

    // GET: api/racks/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Rack>> GetRack(int id)
    {
        var rack = await _context.Racks
            .Include(r => r.Levels)
                .ThenInclude(l => l.Slots)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (rack == null)
            return NotFound();

        return Ok(rack);
    }
}
