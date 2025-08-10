# Dental DMS (No-Backend Demo)

A standalone, dependency-free Dental Management System that runs in any modern browser. Data is stored in localStorage.

## Features
- Patients: full CRUD, notes, insurance fields, search
- Appointments: CRUD, provider conflict validation, status, notes
- Billing: invoices with line items, tax, payment collection, balances
- Inventory: items with qty, reorder level highlighting, vendor, cost
- Staff: roles and activation status
- Dashboard: stats, next appointments, open invoices
- Settings: clinic name, tax rate, export/import JSON, reset demo data

## Run
- Open `index.html` in a modern browser
- No build, no server required

## Notes
- All data is persisted in `localStorage` under the key `dental_dms_v1`
- This demo is single-user and not HIPAA compliant; for production use, add a secure backend, auth, and proper access control