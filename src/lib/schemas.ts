import { z } from 'zod';

export const OptionChoice = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,30}$/),
  name_en: z.string().min(1).max(40),
  name_bn: z.string().max(40).optional(),
  price_delta: z.number().int().min(0).max(5000),
});
export type OptionChoiceType = z.infer<typeof OptionChoice>;

export const OptionGroup = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,30}$/),
  name_en: z.string().min(1).max(40),
  name_bn: z.string().max(40).optional(),
  type: z.enum(['single', 'multi']),
  required: z.boolean(),
  choices: z.array(OptionChoice).min(1).max(10),
});
export type OptionGroupType = z.infer<typeof OptionGroup>;

export const ItemOptions = z.array(OptionGroup).max(6);
export type ItemOptionsType = z.infer<typeof ItemOptions>;

export const CartLine = z.object({
  item_id: z.string().uuid(),
  qty: z.number().int().min(1).max(20),
  choices: z.array(z.string().regex(/^[a-z0-9-]+:[a-z0-9-]+$/)).max(20),
  note: z.string().max(200).optional(),
});
export type CartLineType = z.infer<typeof CartLine>;

export const Cart = z.array(CartLine).max(30);
export type CartType = z.infer<typeof Cart>;

export type RequestType = 'call_waiter' | 'order' | 'bill';
export type RequestStatus = 'new' | 'acknowledged' | 'preparing' | 'ready' | 'done' | 'cancelled';
export type SessionStatus = 'pending' | 'open' | 'closed';

export type SessionRequestJson = {
  id: string;
  type: RequestType;
  status: RequestStatus;
  subtotal: number;
  created_at: string;
  updated_at: string;
};

export type SessionJson = {
  id: string;
  status: SessionStatus;
  requests: SessionRequestJson[];
};

export type TableContextResult = {
  restaurant_slug: string;
  package: number;
  table: {
    id: string;
    number: number;
  };
  session: SessionJson | null;
};

export type SessionStatusResult = {
  session: SessionJson;
  live_session_id: string | null;
};

export type BillLine = {
  name_en: string;
  name_bn: string | null;
  quantity: number;
  unit_price: number;
  options: unknown;
  line_total: number;
  order_status: RequestStatus;
};

export type BillResult = {
  lines: BillLine[];
  subtotal: number;
  service_charge_percent: number;
  service_charge: number;
  vat_percent: number;
  vat: number;
  total: number;
};
