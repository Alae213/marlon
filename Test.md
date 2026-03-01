# Manual Setup Requirements for Testing

This document contains all the manual steps needed to set up and test the Marlon e-commerce platform.

---

## 1. Environment Variables (.env.local)

Create or update your `.env.local` file in the project root with the following values:

```env
# ============================================
# CLERK AUTHENTICATION (Test Mode)
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGVuaWVudC1iaXNvbi04Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_C7OD0QzABG0XyRlJUKs3T6YQLJKRWxf8SRixa8clRm
CLERK_WEBHOOK_SECRET=whsec_placeholder

# ============================================
# CONVEX BACKEND
# ============================================
NEXT_PUBLIC_CONVEX_URL=https://youthful-starfish-778.convex.cloud
CONVEX_DEPLOYMENT=dev:youthful-starfish-778
NEXT_PUBLIC_CONVEX_SITE_URL=https://youthful-starfish-778.convex.site

# ============================================
# CHARGILY PAYMENTS (Test Mode)
# ============================================
CHARGILY_API_KEY=test_sk_JkkxcITLzdYzq7mZB02hejIp3vUn6ibs7Zjs07y4
CHARGILY_WEBHOOK_URL=https://your-domain.com/api/chargily/webhook
NEXT_PUBLIC_CHARGILY_PUBLIC_KEY=test_pk_vur7hlLfTD5ZYNruoOMIhyt4FJKhJzVYf7rd04C3

# ============================================
# APP CONFIGURATION
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# DELIVERY APIS (Optional - Get from providers)
# ============================================
# ZR Express
# ZR_EXPRESS_API_KEY=your_zr_key
# ZR_EXPRESS_API_SECRET=your_zr_secret

# Yalidine
# YALIDINE_API_KEY=your_yalidine_key
# YALIDINE_API_SECRET=your_yalidine_secret
```

---

## 2. Start Development Server

Open a terminal and run:

```bash
cd C:\Users\zaki soft\projects\marlon
npm run dev
```

The application will be available at: **http://localhost:3000**

---

## 3. Convex Backend Setup (Optional)

For full database functionality, run:

```bash
npx convex dev
```

This will:
- Connect to the Convex backend
- Set up the database schema
- Enable real-time subscriptions

**Note:** The app works with mock data without Convex running.

---

## 4. Delivery API Setup (Optional)

To test delivery company integration, get API keys from:

### ZR Express
- Website: https://zrexpress.dz
- Register as a merchant
- Get API Key and API Secret

### Yalidine
- Website: https://yalidine.com
- Register as a merchant
- Get API Key and API Secret

After obtaining keys, add them to `.env.local`:

```env
ZR_EXPRESS_API_KEY=your_key
ZR_EXPRESS_API_SECRET=your_secret
YALIDINE_API_KEY=your_key
YALIDINE_API_SECRET=your_secret
```

---

## 5. Testing Checklist

### Authentication
| Test | Expected Result |
|------|-----------------|
| Visit http://localhost:3000 | Landing page loads |
| Click "دخول" button | Redirects to Clerk sign-in |
| Sign in with Google | Redirects to dashboard |

### Dashboard
| Test | Expected Result |
|------|-----------------|
| View dashboard | Store cards displayed |
| Click "متجر جديد" | Create store modal opens |
| Create store | New store appears in grid |
| Click store card | Navigate to store admin |

### Store Admin
| Test | Expected Result |
|------|-----------------|
| View products page | Product list displayed |
| Add new product | Product added to list |
| View orders page | Orders table loads |
| Click order row | Order detail panel opens |
| Change order status | Status updates with audit trail |
| Add call log | Call appears in log |

### Public Storefront
| Test | Expected Result |
|------|-----------------|
| Visit /[store-slug] | Catalog page loads |
| Browse products | Product grid displayed |
| Click product | Product detail page opens |
| Select variant | Variant selection works |
| Add to cart | Cart count updates |
| Open cart sidebar | Cart items displayed |
| Complete checkout | Order confirmation shown |

### Billing & Payments
| Test | Expected Result |
|------|-----------------|
| View billing section | Trial status shown |
| Exceed order limit (30) | Locked overlay appears |
| Click "اشتراك الآن" | Payment modal opens |
| Complete payment | Store unlocks |

### Delivery Integration
| Test | Expected Result |
|------|-----------------|
| Configure API keys | Connection test passes |
| Send order to delivery | Tracking number generated |
| View tracking | Status updates displayed |

---

## 6. Testing Credentials

### Clerk Test Accounts
Use any Google account to sign in during test mode.

### Chargily Test Cards
When testing payments, use Chargily test card:
- Card Number: `4000 0000 0000 0002`
- Expiry: Any future date
- CVV: `123`

---

## 7. Project Structure

```
marlon/
├── app/                    # Next.js App Router
│   ├── (public)/           # Public storefront routes
│   ├── dashboard/          # Dashboard routes
│   ├── store/[slug]/       # Store admin routes
│   └── api/                # API routes
│       ├── chargily/       # Payment API
│       └── delivery/       # Delivery API
├── components/
│   ├── core/               # Reusable UI components
│   └── *.tsx               # Feature components
├── contexts/               # React contexts
│   ├── billing-context.tsx
│   └── cart-context.tsx
├── lib/                    # Utility functions
│   └── delivery-api.ts
└── convex/                 # Backend schema
    └── schema.ts
```

---

## 8. Common Issues

### Issue: Clerk not loading
**Solution:** Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly.

### Issue: Images not loading
**Solution:** Check that `images.unsplash.com` is allowed in `next.config.ts`.

### Issue: API routes returning 404
**Solution:** Ensure you're accessing via localhost, not production URL.

### Issue: Cart not persisting
**Solution:** This is expected - cart uses React state (not persisted).

---

## 9. Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # TypeScript check
```

---

## 10. Support

For issues or questions:
- Check the console for error messages
- Verify all environment variables are set
- Ensure Node.js version is 18+ (check with `node --version`)
