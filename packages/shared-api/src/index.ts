import type {
  CartItemDto,
  CheckoutPayloadDto,
  CouponValidationDto,
  CustomerProfileDto,
  DeviceRegistrationPayload,
  DeliveryAssignmentDto,
  DeliveryAssignmentStatus,
  MobileAuthResponse,
  MobileVendorDashboardDto,
  NotificationDto,
  OrderDto,
  ProductListResponse,
  PublicProductQuery,
  PublicSearchQuery,
  PublicVendorSummary,
  SearchResponse,
  SupportTicketDto,
  VendorOrderDto,
  VendorProductDto,
  WishlistItemDto,
} from "@fitbazar/shared-types";
import { toQueryString } from "@fitbazar/shared-utils";

type AccessTokenProvider = string | null | undefined | (() => string | null | undefined | Promise<string | null | undefined>);

export type FitBazarApiClientOptions = {
  baseUrl: string;
  getAccessToken?: AccessTokenProvider;
  fetchImpl?: typeof fetch;
};

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  accessToken?: string | null;
};

export class FitBazarApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "FitBazarApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function resolveAccessToken(provider: AccessTokenProvider) {
  if (typeof provider === "function") return provider();
  return provider;
}

function joinUrl(baseUrl: string, path: string) {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const nextPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${nextPath}`;
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }

  return fallback;
}

export class FitBazarApiClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: AccessTokenProvider;
  private readonly fetchImpl: typeof fetch;

  constructor(options: FitBazarApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.getAccessToken = options.getAccessToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const token = options.accessToken ?? (await resolveAccessToken(this.getAccessToken));
    const headers = new Headers(options.headers);

    if (options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await this.fetchImpl(joinUrl(this.baseUrl, path), {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new FitBazarApiError(readErrorMessage(payload, "Request failed"), response.status, payload);
    }

    return payload as T;
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  products(query: PublicProductQuery = {}) {
    return this.get<ProductListResponse>(`/api/products${toQueryString(query)}`);
  }

  search(query: PublicSearchQuery) {
    return this.get<SearchResponse>(`/api/search${toQueryString(query)}`);
  }

  vendors(query: { page?: number; limit?: number } = {}) {
    return this.get<{ vendors: PublicVendorSummary[]; total: number; page: number; totalPages: number }>(
      `/api/vendors${toQueryString(query)}`,
    );
  }

  cart() {
    return this.get<{ items: CartItemDto[] }>("/api/cart");
  }

  addCartItem(input: { productId: string; quantity?: number; size?: string; color?: string }) {
    return this.post<{ item: CartItemDto }>("/api/cart", input);
  }

  checkout(input: CheckoutPayloadDto) {
    return this.post<{ success: true; orders: OrderDto[] }>("/api/orders", input);
  }

  orders() {
    return this.get<{ orders: OrderDto[] }>("/api/orders");
  }

  mobileCart() {
    return this.get<{ items: CartItemDto[] }>("/api/mobile/v1/customer/cart");
  }

  addMobileCartItem(input: { productId: string; quantity?: number; size?: string; color?: string }) {
    return this.post<{ item: CartItemDto }>("/api/mobile/v1/customer/cart", input);
  }

  clearMobileCart() {
    return this.delete<{ success: true }>("/api/mobile/v1/customer/cart");
  }

  updateMobileCartItem(itemId: string, quantity: number) {
    return this.patch<{ item: CartItemDto }>(`/api/mobile/v1/customer/cart/${encodeURIComponent(itemId)}`, { quantity });
  }

  removeMobileCartItem(itemId: string) {
    return this.delete<{ success: true }>(`/api/mobile/v1/customer/cart/${encodeURIComponent(itemId)}`);
  }

  mobileOrders(query: { page?: number; pageSize?: number } = {}) {
    return this.get<{ orders: OrderDto[]; pagination?: unknown }>(`/api/mobile/v1/customer/orders${toQueryString(query)}`);
  }

  mobileCheckout(input: CheckoutPayloadDto) {
    return this.post<{ success: true; orders: OrderDto[] }>("/api/mobile/v1/customer/orders", input);
  }

  notifications() {
    return this.get<{ notifications: NotificationDto[] }>("/api/notifications");
  }

  mobileNotifications() {
    return this.get<{ notifications: NotificationDto[] }>("/api/mobile/v1/notifications");
  }

  markMobileNotificationsRead() {
    return this.patch<{ success: true }>("/api/mobile/v1/notifications");
  }

  mobileProfile() {
    return this.get<{ user: CustomerProfileDto }>("/api/mobile/v1/customer/profile");
  }

  updateMobileProfile(input: { name?: string; phone?: string; image?: string }) {
    return this.patch<{ user: CustomerProfileDto }>("/api/mobile/v1/customer/profile", input);
  }

  mobileAddresses() {
    return this.get<{ addresses: import("@fitbazar/shared-types").AddressDto[] }>("/api/mobile/v1/customer/addresses");
  }

  createMobileAddress(input: import("@fitbazar/shared-types").AddressDto) {
    return this.post<{ address: import("@fitbazar/shared-types").AddressDto }>("/api/mobile/v1/customer/addresses", input);
  }

  updateMobileAddress(id: string, input: Partial<import("@fitbazar/shared-types").AddressDto>) {
    return this.patch<{ address: import("@fitbazar/shared-types").AddressDto }>(`/api/mobile/v1/customer/addresses/${encodeURIComponent(id)}`, input);
  }

  deleteMobileAddress(id: string) {
    return this.delete<{ success: true }>(`/api/mobile/v1/customer/addresses/${encodeURIComponent(id)}`);
  }

  mobileSupport() {
    return this.get<{ tickets: SupportTicketDto[] }>("/api/mobile/v1/customer/support");
  }

  createMobileSupport(input: { topic: string; orderNumber?: string; message: string }) {
    return this.post<{ success: true; ticket: SupportTicketDto }>("/api/mobile/v1/customer/support", input);
  }

  validateCoupon(code: string, subtotal: number) {
    return this.get<{ coupon: CouponValidationDto }>(`/api/cart/validate-coupon${toQueryString({ code, subtotal })}`);
  }

  createMobileReview(input: { productId: string; rating: number; comment?: string }) {
    return this.post<{ review: unknown }>("/api/mobile/v1/customer/reviews", input);
  }

  mobileWishlist() {
    return this.get<{ wishlist: WishlistItemDto[] }>("/api/mobile/v1/customer/wishlist");
  }

  addMobileWishlistItem(input: { productId: string }) {
    return this.post<{ item: WishlistItemDto }>("/api/mobile/v1/customer/wishlist", input);
  }

  removeMobileWishlistItem(idOrProductId: string) {
    return this.delete<{ success: true }>(`/api/mobile/v1/customer/wishlist/${encodeURIComponent(idOrProductId)}`);
  }

  mobileLogin(input: { email: string; password: string; app?: DeviceRegistrationPayload["app"]; deviceId?: string }) {
    return this.post<MobileAuthResponse>("/api/mobile/v1/auth/login", input);
  }

  mobileRegister(input: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
    deviceId?: string;
  }) {
    return this.post<MobileAuthResponse & { verificationRequired?: boolean }>("/api/mobile/v1/auth/register", input);
  }

  mobileGoogleSignIn(input: { idToken: string; deviceId?: string }) {
    return this.post<MobileAuthResponse>("/api/mobile/v1/auth/google", input);
  }

  mobileGoogleExchange(input: { code: string; deviceId?: string }) {
    return this.post<MobileAuthResponse>("/api/mobile/v1/auth/google/exchange", input);
  }

  mobileRefresh(input: { refreshToken: string; deviceId?: string }) {
    return this.post<MobileAuthResponse>("/api/mobile/v1/auth/refresh", input);
  }

  registerDevice(input: DeviceRegistrationPayload) {
    return this.post<{ deviceToken: DeviceRegistrationPayload & { id: string; userId: string; lastSeenAt: string | Date } }>(
      "/api/mobile/v1/devices",
      input,
    );
  }

  mobileDeliveryAssignments(query: { page?: number; pageSize?: number; status?: string; activeOnly?: boolean } = {}) {
    return this.get<{ assignments: DeliveryAssignmentDto[]; pagination?: unknown }>(
      `/api/mobile/v1/delivery/assignments${toQueryString(query)}`,
    );
  }

  mobileVendorDashboard() {
    return this.get<MobileVendorDashboardDto>("/api/mobile/v1/vendor/dashboard");
  }

  mobileVendorProducts(query: { page?: number; pageSize?: number; q?: string } = {}) {
    return this.get<{ products: VendorProductDto[]; pagination?: unknown }>(
      `/api/mobile/v1/vendor/products${toQueryString(query)}`,
    );
  }

  createMobileVendorProduct(input: {
    name: string;
    description: string;
    category: string;
    price: number;
    compareAtPrice?: number;
    stock?: number;
    sizes?: string[];
    colors?: string[];
    tags?: string[];
    images: string[];
  }) {
    return this.post<{ product: VendorProductDto }>("/api/mobile/v1/vendor/products", input);
  }

  mobileVendorOrders(query: { page?: number; pageSize?: number; status?: string; q?: string } = {}) {
    return this.get<{ orders: VendorOrderDto[]; pagination?: unknown }>(
      `/api/mobile/v1/vendor/orders${toQueryString(query)}`,
    );
  }

  updateMobileDeliveryStatus(
    assignmentId: string,
    input: { status: DeliveryAssignmentStatus; note?: string; failureReason?: string; proofImageUrl?: string; location?: unknown },
  ) {
    return this.patch<{ assignment: DeliveryAssignmentDto }>(
      `/api/mobile/v1/delivery/assignments/${encodeURIComponent(assignmentId)}/status`,
      input,
    );
  }
}

export function createFitBazarApiClient(options: FitBazarApiClientOptions) {
  return new FitBazarApiClient(options);
}
