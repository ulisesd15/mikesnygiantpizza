# Admin Panel Phase 1 - Implementation Guide

## 🎉 What's New in Phase 1

Phase 1 adds comprehensive admin functionality to Mike's NY Giant Pizza ordering system:

### ✅ Completed Features

#### 1. **User Management UI**
- View all users with pagination
- Search users by name/email
- Filter by role (Customer/Admin)
- View detailed user profiles with order history
- Change user roles (Customer ↔ Admin)
- Delete users (with protection against self-deletion)
- Real-time user statistics

#### 2. **Inventory Management System**
- Complete ingredient tracking
- Stock level monitoring with color-coded alerts
  - 🚫 RED: Out of stock
  - ⚠️ YELLOW: Low stock (at or below reorder level)
  - 🔵 BLUE: Running low
  - ✅ GREEN: In stock
- Quick stock adjustments (+/- buttons)
- Low stock alerts banner
- Ingredient CRUD operations
- Unit cost and total value calculations
- Supplier tracking
- Multiple unit types support (kg, liters, pieces, etc.)

#### 3. **Enhanced Admin Navigation**
- New "Users" tab in admin panel
- New "Inventory" tab in admin panel
- Updated dashboard with quick action to check inventory
- Seamless navigation between sections

---

## 🚀 Installation & Setup

### 1. Pull Latest Changes

```bash
git checkout main
git pull origin main
git checkout feature/admin-phase1
```

### 2. Backend Setup

The inventory routes are already included. Just restart your server:

```bash
cd backend
npm start
```

The server will automatically sync the `Ingredient` table with the database.

### 3. Database Sync

If you need to manually sync the database:

```bash
# Visit in your browser or use curl:
curl http://localhost:5001/api/db-sync
```

**Note**: If you encounter foreign key errors, you may need to reset the database:

```bash
curl http://localhost:5001/api/db-reset
```

⚠️ **WARNING**: `db-reset` will delete all data!

### 4. Frontend Setup

No additional setup required. The frontend components are automatically imported.

```bash
cd ..
npm run dev
```

---

## 📚 API Endpoints

### Inventory Routes (`/api/inventory`)

All routes require admin authentication.

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|-------------|
| GET | `/` | List all ingredients | Query: `page`, `limit`, `search`, `lowStock` |
| GET | `/low-stock` | Get items at/below reorder level | - |
| GET | `/:id` | Get single ingredient | - |
| POST | `/` | Create new ingredient | `name`, `currentStock`, `reorderLevel`, `unit`, `unitCost`, `supplier` |
| PUT | `/:id` | Update ingredient | Same as POST |
| PATCH | `/:id/adjust` | Quick stock adjustment | `adjustment` (number), `reason` (string) |
| DELETE | `/:id` | Delete ingredient | - |

### User Management Routes (`/api/admin/users`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|-------------|
| GET | `/` | List all users | Query: `page`, `limit`, `role` |
| GET | `/:id` | Get user details with order history | - |
| PUT | `/:id/role` | Change user role | `role` ("customer" or "admin") |
| DELETE | `/:id` | Delete user | - |

---

## 💻 Usage Guide

### Accessing Admin Panel

1. Log in with an admin account
2. Click "Admin" tab in navigation
3. You'll see 5 sections:
   - 📊 **Dashboard**: Overview stats
   - 📋 **Orders**: Order management
   - 🍕 **Menu**: Menu item management
   - 👥 **Users**: NEW - User management
   - 📦 **Inventory**: NEW - Stock management

### Managing Users

#### View Users
- Navigate to "Users" tab
- See stats: Total Users, Customers, Admins
- Search by name or email
- Filter by role

#### Change User Role
1. Find user in list
2. Click "Change Role" button
3. Confirm the role change
4. User's role toggles between Customer ↔ Admin

#### View User Details
1. Click "View" button on any user
2. See profile information
3. View recent order history
4. Close modal when done

#### Delete User
1. Click "Delete" button
2. Confirm deletion
3. Cannot delete yourself (safety protection)

### Managing Inventory

#### View Inventory
- Navigate to "Inventory" tab
- See low stock alert banner if items need reordering
- View all ingredients in card grid
- Each card shows:
  - Stock status (color-coded)
  - Current stock and unit
  - Reorder level
  - Unit cost and total value
  - Supplier information

#### Add Ingredient
1. Click "➕ Add Ingredient" button
2. Fill form:
   - Name (required)
   - Current Stock (required)
   - Reorder Level (required)
   - Unit (dropdown)
   - Unit Cost (optional)
   - Supplier (optional)
3. Click "Save Ingredient"

#### Adjust Stock (Quick Method)
- Use +1, +10, -1, -10 buttons on each card
- Instant stock adjustment
- Cannot go below 0

#### Edit Ingredient
1. Click "✏️ Edit" button
2. Form appears with current values
3. Modify fields
4. Click "Save Ingredient"

#### Delete Ingredient
1. Click "🗑️ Delete" button
2. Confirm deletion

#### Low Stock Filtering
- Toggle "Low Stock Only" checkbox
- View only items at/below reorder level
- Click "View Items" on alert banner for quick filter

---

## 📊 Inventory Model Schema

```javascript
{
  id: INTEGER (Primary Key),
  name: STRING (required),
  currentStock: INTEGER (default: 0),
  reorderLevel: INTEGER (default: 10),
  unit: STRING (default: 'pieces'),
  unitCost: DECIMAL(10, 2) (default: 0),
  supplier: STRING (optional)
}
```

### Supported Units
- pieces
- kg (Kilograms)
- g (Grams)
- liters
- ml (Milliliters)
- lbs (Pounds)
- oz (Ounces)
- boxes
- bags

---

## 🔒 Security Features

### Admin Authentication
- All inventory and user management routes protected
- Must be logged in AND have admin role
- JWT token validation on every request

### User Management Safety
- Cannot change your own role to non-admin
- Cannot delete your own account
- Role validation (only "customer" or "admin" allowed)

### Inventory Protection
- Stock cannot go negative
- Duplicate ingredient names prevented
- Validation on all numeric fields

---

## 🧠 Implementation Details

### Frontend Components

```
frontend/components/admin/
├── OrdersPanel.js      (existing)
├── UsersPanel.js       (NEW)
└── InventoryPanel.js   (NEW)
```

### Backend Routes

```
backend/routes/
├── admin.js         (existing - user mgmt)
├── orders.js        (existing)
├── menu.js          (existing)
└── inventory.js     (NEW)
```

### State Management

Each panel maintains its own state:
- Current page
- Items per page
- Search/filter criteria

State resets when switching sections.

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to fetch inventory"
**Solution**: 
1. Check backend is running on port 5001
2. Verify database is connected
3. Check browser console for errors
4. Ensure you're logged in as admin

### Issue: "Cannot read properties of null"
**Solution**:
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear localStorage: `localStorage.clear()`
3. Log out and log back in

### Issue: Foreign key constraint errors
**Solution**:
```bash
# Reset database (WARNING: deletes all data)
curl http://localhost:5001/api/db-reset
```

### Issue: Low stock alerts not showing
**Solution**:
1. Check ingredient reorder levels are set
2. Verify current stock is at or below reorder level
3. Refresh the inventory page

---

## 🛣️ What's Next - Phase 2

### Enhanced Analytics
- Revenue trends charts
- Popular items analysis
- Order status breakdown
- Peak hours visualization
- Customer metrics

### Inventory Enhancements
- Stock history log
- Automatic stock deduction on orders
- Recipe-ingredient linking
- Bulk import/export
- Supplier management

### Worker Time Tracking
- New User role: "worker"
- Clock in/out interface
- Shift management
- Hours worked reports
- Payroll calculations

---

## 📝 Testing Checklist

### User Management
- [ ] Can view all users
- [ ] Search users works
- [ ] Role filter works
- [ ] Can change user roles
- [ ] Cannot change own role
- [ ] Cannot delete own account
- [ ] User detail modal shows orders
- [ ] Delete user works
- [ ] Pagination works

### Inventory Management
- [ ] Can view all ingredients
- [ ] Low stock banner appears when needed
- [ ] Can add new ingredient
- [ ] Can edit ingredient
- [ ] Can delete ingredient
- [ ] Quick adjust buttons work (+1, +10, -1, -10)
- [ ] Cannot adjust stock below 0
- [ ] Search ingredients works
- [ ] Low stock filter works
- [ ] Stock status colors correct
- [ ] Unit cost calculations accurate

### Integration
- [ ] Admin nav shows Users and Inventory tabs
- [ ] Section switching works smoothly
- [ ] No console errors
- [ ] Forms reset properly
- [ ] Toasts show success/error messages
- [ ] Page refreshes don't break state

---

## 👥 Contributors

Phase 1 Implementation by Mike's Development Team

## 💬 Support

For issues or questions:
1. Check this guide first
2. Review console logs
3. Check network tab for API errors
4. Verify admin authentication

---

**Happy Admin Managing! 🍕👨‍🍳**
