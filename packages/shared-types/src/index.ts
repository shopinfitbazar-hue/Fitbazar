export const USER_ROLES = ["CUSTOMER", "VENDOR", "DELIVERY", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "HIDDEN", "OUT_OF_STOCK"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "RECEIVED",
  "PACKED",
  "HANDED_TO_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "DISPUTED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SUPPORTED_PAYMENT_METHODS = [
  "COD",
  "ESEWA",
  "KHALTI",
  "CONNECTIPS",
  "FONEPAY",
  "LOCAL_CARD",
] as const;
export type SupportedPaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];

export const DELIVERY_METHODS = ["standard", "express", "pickup"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export type ApiErrorPayload = {
  error: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PublicVendorSummary = {
  id: string;
  shopName: string;
  slug: string | null;
  logo?: string | null;
  category?: string | null;
  isPartnered?: boolean;
  isTopShop?: boolean;
};

export type PublicProductSummary = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  discountPct?: number;
  images: string[];
  category: string;
  sizes?: string[];
  colors?: string[];
  totalSold?: number;
  stock?: number;
  vendor?: PublicVendorSummary | null;
  reviewCount?: number;
  averageRating?: number;
};

export type ProductListFilters = {
  categories: string[];
  sizes: string[];
  colors: string[];
};

export type ProductListResponse = {
  products: PublicProductSummary[];
  total: number;
  page: number;
  totalPages: number;
  filters?: ProductListFilters;
  queryKey?: string;
};

export type PublicProductQuery = {
  sort?: string;
  tag?: string;
  category?: string;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  size?: string[];
  color?: string[];
  q?: string;
  limit?: number;
  page?: number;
  featured?: boolean;
};

export type PublicSearchQuery = Omit<PublicProductQuery, "featured" | "minDiscount"> & {
  rating?: number;
  inStock?: boolean;
};

export type SearchResponse = ProductListResponse & {
  vendors: PublicVendorSummary[];
  categories: Array<{
    id: string;
    name: string;
  }>;
};

export type CartItemDto = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  vendorId: string;
  vendorName: string;
  vendorSlug?: string | null;
  quantity: number;
  size?: string;
  color?: string;
};

export type AddressDto = {
  id?: string;
  name: string;
  phone: string;
  line1: string;
  zone: string;
  district: string;
  pincode?: string;
  email?: string;
  isDefault?: boolean;
};

export type CustomerProfileDto = {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  image?: string | null;
  role: UserRole;
  createdAt?: string | Date;
};

export type SupportTicketDto = {
  id: string;
  topic: string;
  orderNumber?: string | null;
  message: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  messages?: Array<{ id?: string; sender: string; message: string; createdAt?: string | Date }>;
};

export type CouponValidationDto = {
  id: string;
  code: string;
  discountPct: number;
  discountAmount: number;
};

export type CheckoutItemInput = {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
};

export type CheckoutPayloadDto = {
  items: CheckoutItemInput[];
  address: Omit<AddressDto, "id" | "isDefault"> & {
    pincode: string;
  };
  paymentMethod: SupportedPaymentMethod;
  couponCode?: string;
  deliveryMethod: DeliveryMethod;
  idempotencyKey?: string;
};

export type OrderItemDto = {
  id?: string;
  productId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  price: number;
  product?: Pick<PublicProductSummary, "id" | "slug" | "name" | "images">;
};

export type OrderDto = {
  id: string;
  orderNumber: string;
  checkoutGroupId?: string | null;
  customerId: string;
  vendorId: string;
  totalAmount: number;
  commissionAmt?: number;
  vendorPayout?: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference?: string | null;
  deliveryAddress: unknown;
  trackingNumber?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: OrderItemDto[];
  vendor?: PublicVendorSummary | null;
};

export type VendorOrderDto = OrderDto & {
  customer?: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

export type VendorProductDto = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category: string;
  price: number;
  compareAtPrice?: number | null;
  discountPct?: number | null;
  stock: number;
  images: string[];
  sizes?: string[];
  colors?: string[];
  status: ProductStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type MobileVendorDashboardDto = {
  vendor: {
    id: string;
    shopName: string;
    slug?: string | null;
    isApproved: boolean;
    isSuspended: boolean;
    isPartnered?: boolean;
    partnerStatus?: string | null;
    partnerPlan?: string | null;
  };
  stats: {
    todaysRevenue: number;
    ordersToday: number;
    pendingOrders: number;
    products: number;
    lowStockProducts: number;
    avgRating: number;
  };
  recentOrders: VendorOrderDto[];
};

export const DELIVERY_ASSIGNMENT_STATUSES = [
  "ASSIGNED",
  "PICKUP_CONFIRMED",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
] as const;
export type DeliveryAssignmentStatus = (typeof DELIVERY_ASSIGNMENT_STATUSES)[number];

export type DeliveryAssignmentDto = {
  id: string;
  status: DeliveryAssignmentStatus;
  pickupAt?: string | Date | null;
  inTransitAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  failedAt?: string | Date | null;
  failureReason?: string | null;
  proofImageUrl?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  order: OrderDto & {
    orderNumber: string;
    customer?: {
      name?: string | null;
      phone?: string | null;
    };
    vendor?: {
      shopName: string;
      phone?: string | null;
      address?: string | null;
      zone?: string | null;
      district?: string | null;
    } | null;
  };
  earning?: {
    id: string;
    amount: number;
    status: string;
    releasedAt?: string | Date | null;
  } | null;
};

export type NotificationDto = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string | Date;
};

export type WishlistItemDto = {
  id: string;
  createdAt: string | Date;
  product: PublicProductSummary;
};

export type MobileSessionUser = {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  image?: string | null;
  role: UserRole;
  vendorId?: string | null;
  deliveryPartnerId?: string | null;
};

export type MobileAuthResponse = {
  user: MobileSessionUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export type DeviceRegistrationPayload = {
  app: "CUSTOMER_APP" | "VENDOR_APP" | "DELIVERY_APP";
  platform: "ios" | "android" | "web";
  deviceId: string;
  pushToken: string;
  provider: "EXPO" | "FCM" | "APNS";
};
