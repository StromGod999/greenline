#!/usr/bin/env python
"""
GreenPulse Online Mobile Store - Python One-Click Launcher
Automatically prepares database migrations, runs the seeder script, and launches Django.
"""
import os
import sys
import subprocess

def run_cmd(cmd_list, title=""):
    if title:
        print(f"\n⚙️  {title}...")
    try:
        subprocess.run(cmd_list, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during '{' '.join(cmd_list)}': {e}")
        return False
    return True

def main():
    print("=" * 65)
    print("     🌿 GreenPulse Online Mobile Store (Django 2026)")
    print("=" * 65)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    # 1. Database Migrations
    run_cmd([sys.executable, "manage.py", "makemigrations", "store"], "Creating migrations")
    run_cmd([sys.executable, "manage.py", "migrate"], "Applying database migrations")

    # 2. Populate Database
    run_cmd([sys.executable, "populate_db.py"], "Seeding initial smartphone catalog & admin")

    print("\n" + "=" * 65)
    print("🚀 GreenPulse Mobile Store is Ready!")
    print("🔗 Storefront:      http://127.0.0.1:8000/")
    print("👑 Custom Admin:    http://127.0.0.1:8000/admin-dashboard/")
    print("⚙️  Django Admin:    http://127.0.0.1:8000/admin/")
    print("🔑 Admin Login:     admin / admin123")
    print("👤 Customer Login:  customer / customer123")
    print("🎟️  Promo Code:      GREEN10 (10% OFF)")
    print("=" * 65 + "\n")

    # 3. Start Server
    run_cmd([sys.executable, "manage.py", "runserver", "127.0.0.1:8000"], "Starting Django development server")

if __name__ == '__main__':
    main()
