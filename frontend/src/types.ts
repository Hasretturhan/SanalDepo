export interface Warehouse {
  id: number;
  name: string;
  code?: string | null;
  address?: string | null;
  racks: Rack[];
}

export interface Rack {
  id: number;
  code: string;
  warehouseId: number;
  warehouse?: Warehouse | null;
  levels: RackLevel[];
}

export interface RackLevel {
  id: number;
  levelNumber: number;
  rackId: number;
  rack?: Rack | null;
  slots: Slot[];
}

export interface Slot {
  id: number;
  code: string;
  rackLevelId: number;
  rackLevel?: RackLevel | null;
  boxes: Box[];
}

export interface Box {
  id: number;
  boxCode: string;
  productName?: string | null;
  quantity: number;
  slotId?: number | null;
  slot?: Slot | null; // admin panelde konumu göstermek için
}
