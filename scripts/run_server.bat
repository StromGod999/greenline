@echo off
title Greenline Online Mobile Store
cd /d "%~dp0.."
echo ===============================================================
echo     Greenline Mobile Store - Django Server Launcher
echo ===============================================================
echo.

echo [1/3] Checking dependencies and applying database migrations...
python manage.py makemigrations store
python manage.py migrate

echo.
echo [2/3] Seeding smartphone catalog, brands, coupons, and admin accounts...
python populate_db.py

echo.
echo [3/3] Starting Django Web Server at http://127.0.0.1:8000/ ...
echo ---------------------------------------------------------------
echo Storefront URL:      http://127.0.0.1:8000/
echo Custom Admin Panel:  http://127.0.0.1:8000/admin-dashboard/
echo Standard Django Admin: http://127.0.0.1:8000/admin/
echo Admin Credentials:   Username: admin  ^|  Password: admin123
echo Demo Customer:       Username: customer ^| Password: customer123
echo Promo Coupon:        GREEN10 (10%% OFF)
echo ---------------------------------------------------------------
echo Press Ctrl+C in this window to stop the server.
echo.

python manage.py runserver 127.0.0.1:8000
pause
