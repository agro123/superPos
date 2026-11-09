import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from '@/shared/infrastructure/offline/idbStorage';
import {
  addToCart,
  removeFromCart,
  setLineQuantity,
  type CartLine,
  type CartProduct,
} from '../domain/cart';
import {
  closeOrder,
  createOrderBook,
  openOrder,
  selectOrder,
  loadRestaurantOrder,
  setActiveCustomer,
  updateActiveLines,
  type OrderBook,
  type RestaurantLink,
} from '../domain/orders';

interface CartState {
  /** Órdenes en curso por negocio (borradores locales). */
  books: Record<string, OrderBook>;
  add: (businessId: string, product: CartProduct) => void;
  setQuantity: (businessId: string, productId: string, quantity: number) => void;
  remove: (businessId: string, productId: string) => void;
  clear: (businessId: string) => void;
  openOrder: (businessId: string) => void;
  selectOrder: (businessId: string, orderId: string) => void;
  closeOrder: (businessId: string, orderId: string) => void;
  setCustomer: (businessId: string, customerId: string | null) => void;
  loadRestaurantOrder: (businessId: string, link: RestaurantLink, lines: CartLine[]) => void;
}

const newId = () => crypto.randomUUID();

const bookOf = (state: CartState, businessId: string) =>
  state.books[businessId] ?? createOrderBook(newId());

const update = (state: CartState, businessId: string, change: (book: OrderBook) => OrderBook) => ({
  books: { ...state.books, [businessId]: change(bookOf(state, businessId)) },
});

const updateLines = (
  state: CartState,
  businessId: string,
  change: (lines: CartLine[]) => CartLine[],
) => update(state, businessId, (book) => updateActiveLines(book, change));

/** Órdenes persistidas en IndexedDB: sobreviven a recargas y cierres (offline-first). */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      books: {},
      add: (businessId, product) => {
        set((state) => updateLines(state, businessId, (lines) => addToCart(lines, product)));
      },
      setQuantity: (businessId, productId, quantity) => {
        set((state) =>
          updateLines(state, businessId, (lines) => setLineQuantity(lines, productId, quantity)),
        );
      },
      remove: (businessId, productId) => {
        set((state) => updateLines(state, businessId, (lines) => removeFromCart(lines, productId)));
      },
      clear: (businessId) => {
        set((state) => updateLines(state, businessId, () => []));
      },
      openOrder: (businessId) => {
        set((state) => update(state, businessId, (book) => openOrder(book, newId())));
      },
      selectOrder: (businessId, orderId) => {
        set((state) => update(state, businessId, (book) => selectOrder(book, orderId)));
      },
      loadRestaurantOrder: (businessId, link, lines) => {
        set((state) =>
          update(state, businessId, (book) => loadRestaurantOrder(book, newId(), link, lines)),
        );
      },
      setCustomer: (businessId, customerId) => {
        set((state) => update(state, businessId, (book) => setActiveCustomer(book, customerId)));
      },
      closeOrder: (businessId, orderId) => {
        set((state) => update(state, businessId, (book) => closeOrder(book, orderId, newId())));
      },
    }),
    {
      name: 'superpos.cart',
      storage: createJSONStorage(() => idbStorage),
      version: 2,
      // v1 guardaba un único carrito por negocio: pasa a ser la orden 1.
      migrate: (persisted, version) => {
        if (version >= 2) return persisted;
        const { carts = {} } = (persisted ?? {}) as { carts?: Record<string, CartLine[]> };
        const books: Record<string, OrderBook> = {};
        for (const [businessId, lines] of Object.entries(carts)) {
          books[businessId] = createOrderBook(newId(), lines);
        }
        return { books };
      },
    },
  ),
);
