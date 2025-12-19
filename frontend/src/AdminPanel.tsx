import React, { useEffect, useMemo, useState } from "react";
import { Box, Warehouse, Rack, RackLevel, Slot } from "./types";

const API_BASE = "http://localhost:5204";

type Props = {
  warehouse: Warehouse;
  reloadWarehouse: () => Promise<void>;
};

type SlotOption = {
  id: number;
  label: string;
};

function buildSlotOptions(warehouse: Warehouse): SlotOption[] {
  const options: SlotOption[] = [];

  warehouse.racks.forEach((rack: Rack) => {
    rack.levels
      .slice()
      .sort((a, b) => a.levelNumber - b.levelNumber)
      .forEach((level: RackLevel) => {
        level.slots.forEach((slot: Slot) => {
          const label = `${warehouse.code ?? warehouse.name} / ${
            rack.code
          } / Seviye ${level.levelNumber} / ${slot.code}`;
          options.push({ id: slot.id, label });
        });
      });
  });

  return options;
}

const AdminPanel: React.FC<Props> = ({ warehouse, reloadWarehouse }) => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Yeni koli ekleme formu
  const [newSlotId, setNewSlotId] = useState<number | "">("");
  const [newProductName, setNewProductName] = useState("");
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [creating, setCreating] = useState(false);

  const slotOptions = useMemo(
    () => buildSlotOptions(warehouse),
    [warehouse]
  );

  const loadBoxes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/boxes`);
      if (!res.ok) {
        throw new Error(`API hata kodu: ${res.status}`);
      }
      const data: Box[] = await res.json();
      setBoxes(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Koliler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoxes();
  }, []);

  const startEdit = (box: Box) => {
    setEditingId(box.id);
    setEditProductName(box.productName ?? "");
    setEditQuantity(box.quantity);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditProductName("");
    setEditQuantity(0);
  };

  const saveEdit = async () => {
    if (editingId === null) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/boxes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: editProductName,
          quantity: editQuantity,
        }),
      });

      if (!res.ok) {
        throw new Error(`API hata kodu: ${res.status}`);
      }

      await loadBoxes();
      await reloadWarehouse();
      cancelEdit();
    } catch (err: any) {
      console.error(err);
      alert(err.message ?? "Koli güncellenirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBox = async (id: number) => {
    if (!window.confirm("Bu koliyi silmek istediğine emin misin?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/boxes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`API hata kodu: ${res.status}`);
      }

      await loadBoxes();
      await reloadWarehouse();
    } catch (err: any) {
      console.error(err);
      alert(err.message ?? "Koli silinirken hata oluştu.");
    }
  };

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSlotId === "" || !newProductName || newQuantity <= 0) return;

    setCreating(true);
        // Bu gözde zaten koli var mı?
    const existing = boxes.find(
      (b) => b.slot && b.slot.id === newSlotId
    );
    if (existing) {
      setCreating(false);
      alert(
        "Bu konumda zaten bir koli var. Önce mevcut koliyi sil veya başka konuma taşı."
      );
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/boxes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boxCode: null,
          productName: newProductName,
          quantity: newQuantity,
          slotId: newSlotId,
        }),
      });

      if (!res.ok) {
        throw new Error(`API hata kodu: ${res.status}`);
      }

      // Yeni koli eklendi; listeleri tazele
      await loadBoxes();
      await reloadWarehouse();

      setNewProductName("");
      setNewQuantity(1);
      setNewSlotId("");
    } catch (err: any) {
      console.error(err);
      alert(err.message ?? "Yeni koli eklenirken hata oluştu.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="admin-panel">Koliler yükleniyor...</div>;
  }

  if (error) {
    return <div className="admin-panel error">Hata: {error}</div>;
  }

  return (
    <div className="admin-panel">
      <h3>Koli Yönetimi (Admin Paneli)</h3>

      {/* Yeni koli ekleme formu */}
      <div className="admin-create-box">
        <h4>Yeni Koli Ekle</h4>
        <form onSubmit={handleCreateBox} className="admin-create-form">
          <label>
            Konum (Depo / Raf / Seviye / Göz)
            <select
              value={newSlotId}
              onChange={(e) =>
                setNewSlotId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              required
            >
              <option value="">Seçiniz...</option>
              {slotOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ürün Adı
            <input
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              required
            />
          </label>
          <label>
            Miktar
            <input
              type="number"
              min={1}
              value={newQuantity}
              onChange={(e) =>
                setNewQuantity(Number(e.target.value) || 0)
              }
              required
            />
          </label>
          <button
            type="submit"
            disabled={creating || newSlotId === "" || newQuantity <= 0}
          >
            {creating ? "Ekleniyor..." : "Koli Ekle"}
          </button>
        </form>
      </div>

      <button onClick={loadBoxes} style={{ marginBottom: 8 }}>
        Listeyi Yenile
      </button>

      <table className="admin-table">
        <thead>
          <tr>
            <th>BoxCode</th>
            <th>Ürün Adı</th>
            <th>Miktar</th>
            <th>Göz</th>
            <th>Seviye</th>
            <th>Raf</th>
            <th>Depo</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {boxes.map((box) => {
            const slot = box.slot;
            const level = slot?.rackLevel;
            const rack = level?.rack;
            const wh = rack?.warehouse;

            const isEditing = editingId === box.id;

            return (
              <tr key={box.id}>
                <td>{box.boxCode}</td>
                <td>
                  {isEditing ? (
                    <input
                      className="admin-input"
                      value={editProductName}
                      onChange={(e) =>
                        setEditProductName(e.target.value)
                      }
                    />
                  ) : (
                    box.productName
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="admin-input"
                      type="number"
                      min={0}
                      value={editQuantity}
                      onChange={(e) =>
                        setEditQuantity(Number(e.target.value) || 0)
                      }
                    />
                  ) : (
                    box.quantity
                  )}
                </td>
                <td>{slot?.code ?? "-"}</td>
                <td>{level?.levelNumber ?? "-"}</td>
                <td>{rack?.code ?? "-"}</td>
                <td>{wh?.code ?? "-"}</td>
                <td>
                  <div className="admin-actions">
                    {isEditing ? (
                      <>
                        <button
                          className="edit-btn"
                          onClick={saveEdit}
                          disabled={saving}
                        >
                          Kaydet
                        </button>
                        <button onClick={cancelEdit}>İptal</button>
                      </>
                    ) : (
                      <>
                        <button
                          className="edit-btn"
                          onClick={() => startEdit(box)}
                        >
                          Düzenle
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteBox(box.id)}
                        >
                          Sil
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
