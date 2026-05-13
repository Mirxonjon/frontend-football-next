import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED_PRICE";

export type SubscriptionPlan = {
  id: number;
  titleUz: string;
  titleRu: string;
  descriptionUz: string;
  descriptionRu: string;
  durationDays: number;
  basePrice: number;
  discountType: DiscountType;
  discountPercent: number;
  fixedDiscountPrice: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Subscription = {
  id: number;
  userId: number;
  subscriptionsPlansId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoPay: boolean;
  cardId: number | null;
  lastRenewalAttemptAt: string | null;
  lastExpiryNoticeDay: number | null;
  subscriptionsPlan: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
};

type SubscriptionsState = {
  active: Subscription[];
  history: Subscription[];
  loading: boolean;
  error: string;
  mutating: boolean;
};

export const fetchMySubscriptions = createAsyncThunk<
  { active: Subscription[]; history: Subscription[] },
  void,
  { rejectValue: string }
>("subscriptions/fetchMine", async (_, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{
      status_code: number;
      data: { active: Subscription[]; history: Subscription[] };
    }>("/subscriptions/me");
    return {
      active: res.data?.data?.active ?? [],
      history: res.data?.data?.history ?? [],
    };
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load subscriptions"
    );
  }
});

export const createSubscription = createAsyncThunk<
  { subscription: Subscription; transaction: { id: number; amount: number; status: string } },
  { planId: number; cardId?: number; autoPay?: boolean },
  { rejectValue: { code?: number; message: string; raw?: any } }
>("subscriptions/create", async (body, { rejectWithValue }) => {
  try {
    const res = await FT_API.post<{
      status_code: number;
      data: any;
    }>("/subscriptions/me", body);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue({
      code: err?.response?.status,
      message:
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Subscription failed",
      raw: err?.response?.data,
    });
  }
});

export const setAutoPay = createAsyncThunk<
  Subscription,
  { enabled: boolean; cardId?: number },
  { rejectValue: string }
>("subscriptions/setAutoPay", async (body, { rejectWithValue }) => {
  try {
    const res = await FT_API.patch<{ status_code: number; data: Subscription }>(
      "/subscriptions/me/auto-pay",
      body
    );
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Auto-pay update failed"
    );
  }
});

const initialState: SubscriptionsState = {
  active: [],
  history: [],
  loading: false,
  error: "",
  mutating: false,
};

const slice = createSlice({
  name: "subscriptions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMySubscriptions.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchMySubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.active = action.payload.active;
        state.history = action.payload.history;
      })
      .addCase(fetchMySubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      })
      .addCase(createSubscription.pending, (state) => {
        state.mutating = true;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.mutating = false;
        if (action.payload.subscription) {
          state.active = [action.payload.subscription, ...state.active];
        }
      })
      .addCase(createSubscription.rejected, (state) => {
        state.mutating = false;
      })
      .addCase(setAutoPay.pending, (state) => {
        state.mutating = true;
      })
      .addCase(setAutoPay.fulfilled, (state, action) => {
        state.mutating = false;
        const idx = state.active.findIndex((s) => s.id === action.payload.id);
        if (idx >= 0) state.active[idx] = action.payload;
      })
      .addCase(setAutoPay.rejected, (state) => {
        state.mutating = false;
      });
  },
});

export const subscriptionsActions = slice.actions;
export const subscriptionsReducer = slice.reducer;

// ─── Helpers ──────────────────────────────────────────────
export const computePlanPrice = (plan: SubscriptionPlan): number => {
  if (
    (plan.discountType === "FIXED_PRICE" || (plan.discountType as any) === "FIXED") &&
    plan.fixedDiscountPrice != null
  ) {
    return plan.fixedDiscountPrice;
  }
  if (
    (plan.discountType === "PERCENTAGE" || (plan.discountType as any) === "PERCENT") &&
    plan.discountPercent > 0
  ) {
    const off = (plan.basePrice * plan.discountPercent) / 100;
    return Math.max(0, Math.round(plan.basePrice - off));
  }
  return plan.basePrice;
};

export const planHasDiscount = (plan: SubscriptionPlan): boolean => {
  return (
    ((plan.discountType === "FIXED_PRICE" || (plan.discountType as any) === "FIXED") &&
      plan.fixedDiscountPrice != null) ||
    ((plan.discountType === "PERCENTAGE" || (plan.discountType as any) === "PERCENT") &&
      plan.discountPercent > 0)
  );
};
